const http = require("http");
const fs = require("fs");
const url = require("url");

const PORT = 4001;

// Load indices
let packages = {};
let searchIndex = [];

try {
  packages = JSON.parse(fs.readFileSync("/home/kimjin/kpm-registry/freelang-packages.json", "utf-8"));
  const indexData = JSON.parse(fs.readFileSync("/home/kimjin/kpm-registry/search-index.json", "utf-8"));
  searchIndex = indexData.search_index;
  console.log("✅ Loaded", packages.packages.length, "packages");
  console.log("✅ Loaded", searchIndex.length, "search indices");
} catch (e) {
  console.error("Error loading data:", e);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Health check
  if (pathname === "/api/ping") {
    return res.end(JSON.stringify({ status: "ok", timestamp: new Date() }));
  }

  // Search packages
  if (pathname === "/api/search") {
    const q = (query.q || "").toLowerCase();

    if (q === "") {
      const allPackages = packages.packages.map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
        description: p.description,
        category: p.category
      }));
      return res.end(JSON.stringify({ results: allPackages, total: allPackages.length }));
    }

    const results = searchIndex
      .filter(idx => idx.searchable_text.includes(q) || idx.name.includes(q))
      .map(idx => {
        const pkg = packages.packages.find(p => p.id === idx.id);
        return {
          id: pkg.id,
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          category: pkg.category,
          ranking: idx.ranking,
          features: pkg.features
        };
      })
      .sort((a, b) => b.ranking - a.ranking);

    return res.end(JSON.stringify({
      query: q,
      results,
      total: results.length
    }));
  }

  // Get package details
  if (pathname.startsWith("/api/package/")) {
    const pkgId = pathname.replace("/api/package/", "");
    const pkg = packages.packages.find(p => p.id === pkgId);

    if (!pkg) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: "Package not found" }));
    }

    return res.end(JSON.stringify(pkg));
  }

  // List all packages
  if (pathname === "/api/packages") {
    const list = packages.packages.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      category: p.category,
      level: p.level,
      completeness: p.completeness
    }));
    return res.end(JSON.stringify({ packages: list, total: list.length }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log("🚀 KPM Search Server running on http://localhost:" + PORT);
  console.log("📍 Endpoints:");
  console.log("   GET /api/ping - Health check");
  console.log("   GET /api/search?q=freelang - Search packages");
  console.log("   GET /api/package/@freelang/compiler - Get package details");
  console.log("   GET /api/packages - List all packages");
});
