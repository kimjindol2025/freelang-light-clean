/**
 * Database Layer - Simple JSON-based Storage
 * Production-ready with file persistence
 *
 * Features:
 * - Simple in-memory JSON store
 * - File persistence (auto-save)
 * - Collections (tables)
 * - Query & filtering
 * - Transaction support (atomic operations)
 */

const fs = require('fs');
const path = require('path');

/**
 * Simple Database Engine
 * Stores data in JSON file (development/demo purposes)
 */
class Database {
  constructor(filepath = './data.json') {
    this.filepath = filepath;
    this.data = {};
    this.collections = new Map();
    this.autoSave = true;
    this.saveInterval = 1000; // ms
    this.dirty = false;
    this.saveLocked = false;

    this.load();

    // 자동 저장 스케줄
    if (this.autoSave) {
      setInterval(() => {
        if (this.dirty && !this.saveLocked) {
          this.saveSync();
        }
      }, this.saveInterval);
    }
  }

  /**
   * 파일에서 데이터 로드
   */
  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const content = fs.readFileSync(this.filepath, 'utf-8');
        this.data = JSON.parse(content);
        console.log(`📂 Database loaded from ${this.filepath}`);
      } else {
        this.data = {};
        this.saveSync();
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load database: ${error.message}`);
      this.data = {};
    }
  }

  /**
   * 파일에 데이터 저장 (동기)
   */
  saveSync() {
    try {
      this.saveLocked = true;
      const dir = path.dirname(this.filepath);

      // 디렉토리 생성
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
      this.dirty = false;
    } catch (error) {
      console.error(`❌ Failed to save database: ${error.message}`);
    } finally {
      this.saveLocked = false;
    }
  }

  /**
   * 파일에 데이터 저장 (비동기)
   */
  async save() {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.dirname(this.filepath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFile(
          this.filepath,
          JSON.stringify(this.data, null, 2),
          'utf-8',
          (err) => {
            if (err) reject(err);
            else {
              this.dirty = false;
              resolve();
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 컬렉션 생성 또는 가져오기
   */
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection(name, this));
    }
    return this.collections.get(name);
  }

  /**
   * 데이터 리셋
   */
  reset() {
    this.data = {};
    this.dirty = true;
    this.saveSync();
  }

  /**
   * 전체 데이터 백업
   */
  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.filepath.replace('.json', `-backup-${timestamp}.json`);
    fs.copyFileSync(this.filepath, backupPath);
    return backupPath;
  }

  /**
   * 전체 데이터 조회
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * 데이터베이스 통계
   */
  stats() {
    const stats = {};
    for (const [name, data] of Object.entries(this.data)) {
      stats[name] = Array.isArray(data) ? data.length : Object.keys(data).length;
    }
    return stats;
  }
}

/**
 * 컬렉션 클래스 (테이블 같은 개념)
 */
class Collection {
  constructor(name, db) {
    this.name = name;
    this.db = db;
    this.idCounter = 0;

    // 데이터베이스에서 컬렉션 초기화
    if (!this.db.data[name]) {
      this.db.data[name] = [];
    }
  }

  /**
   * 문서 추가
   */
  insert(doc) {
    if (!Array.isArray(this.db.data[this.name])) {
      this.db.data[this.name] = [];
    }

    // ID 자동 생성
    if (!doc.id) {
      doc.id = ++this.idCounter;
    } else if (typeof doc.id === 'number' && doc.id >= this.idCounter) {
      this.idCounter = doc.id;
    }

    // 타임스탐프 추가
    doc.createdAt = doc.createdAt || new Date().toISOString();
    doc.updatedAt = new Date().toISOString();

    this.db.data[this.name].push(doc);
    this.db.dirty = true;

    return doc;
  }

  /**
   * 여러 문서 추가
   */
  insertMany(docs) {
    return docs.map((doc) => this.insert(doc));
  }

  /**
   * ID로 찾기
   */
  findById(id) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return null;
    return data.find((doc) => doc.id == id) || null;
  }

  /**
   * 쿼리로 찾기
   */
  findOne(query) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return null;

    return data.find((doc) => this.matches(doc, query)) || null;
  }

  /**
   * 모든 문서 찾기
   */
  findAll(query = null) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return [];

    if (!query || Object.keys(query).length === 0) {
      return JSON.parse(JSON.stringify(data));
    }

    return data
      .filter((doc) => this.matches(doc, query))
      .map((doc) => JSON.parse(JSON.stringify(doc)));
  }

  /**
   * 문서 수 세기
   */
  count(query = null) {
    return this.findAll(query).length;
  }

  /**
   * ID로 업데이트
   */
  updateById(id, updates) {
    const doc = this.findById(id);
    if (!doc) return null;

    Object.assign(doc, updates);
    doc.updatedAt = new Date().toISOString();
    this.db.dirty = true;

    return doc;
  }

  /**
   * 첫 번째 매칭 문서 업데이트
   */
  updateOne(query, updates) {
    const doc = this.findOne(query);
    if (!doc) return null;

    Object.assign(doc, updates);
    doc.updatedAt = new Date().toISOString();
    this.db.dirty = true;

    return doc;
  }

  /**
   * 모든 매칭 문서 업데이트
   */
  updateMany(query, updates) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return [];

    const updated = [];
    for (const doc of data) {
      if (this.matches(doc, query)) {
        Object.assign(doc, updates);
        doc.updatedAt = new Date().toISOString();
        updated.push(doc);
      }
    }

    if (updated.length > 0) {
      this.db.dirty = true;
    }

    return updated;
  }

  /**
   * ID로 삭제
   */
  deleteById(id) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return false;

    const index = data.findIndex((doc) => doc.id == id);
    if (index === -1) return false;

    data.splice(index, 1);
    this.db.dirty = true;
    return true;
  }

  /**
   * 첫 번째 매칭 문서 삭제
   */
  deleteOne(query) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return false;

    const index = data.findIndex((doc) => this.matches(doc, query));
    if (index === -1) return false;

    data.splice(index, 1);
    this.db.dirty = true;
    return true;
  }

  /**
   * 모든 매칭 문서 삭제
   */
  deleteMany(query) {
    const data = this.db.data[this.name];
    if (!Array.isArray(data)) return 0;

    const originalLength = data.length;
    const filtered = data.filter((doc) => !this.matches(doc, query));

    if (filtered.length < originalLength) {
      this.db.data[this.name] = filtered;
      this.db.dirty = true;
      return originalLength - filtered.length;
    }

    return 0;
  }

  /**
   * 컬렉션 비우기
   */
  clear() {
    this.db.data[this.name] = [];
    this.db.dirty = true;
  }

  /**
   * 문서 수
   */
  length() {
    const data = this.db.data[this.name];
    return Array.isArray(data) ? data.length : 0;
  }

  /**
   * 쿼리 매칭 로직
   */
  matches(doc, query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        // $in 연산자
        if (!value.includes(doc[key])) return false;
      } else if (typeof value === 'object' && value !== null) {
        // 조건부 연산자 ($gt, $lt, $eq 등)
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case '$gt':
              if (!(doc[key] > opValue)) return false;
              break;
            case '$gte':
              if (!(doc[key] >= opValue)) return false;
              break;
            case '$lt':
              if (!(doc[key] < opValue)) return false;
              break;
            case '$lte':
              if (!(doc[key] <= opValue)) return false;
              break;
            case '$eq':
              if (doc[key] !== opValue) return false;
              break;
            case '$ne':
              if (doc[key] === opValue) return false;
              break;
            case '$regex':
              if (!new RegExp(opValue).test(doc[key])) return false;
              break;
          }
        }
      } else if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * 트랜잭션 (원자적 연산)
   */
  transaction(callback) {
    const backup = JSON.parse(JSON.stringify(this.db.data));
    try {
      const result = callback(this);
      this.db.dirty = true;
      return { success: true, result };
    } catch (error) {
      // 롤백
      this.db.data = backup;
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  Database,
  Collection,
};
