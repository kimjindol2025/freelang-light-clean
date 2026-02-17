# FreeLang stdlib/http - HTTP Server & Client
# Implements libuv-based async HTTP for FreeLang

CC = gcc
CFLAGS = -Wall -Wextra -fPIC -O2
LDFLAGS = -shared

# libuv는 별도로 설치 필요
# sudo apt-get install libuv1-dev
LIBUV_CFLAGS = $(shell pkg-config --cflags libuv || echo "-I/usr/include")
LIBUV_LIBS = $(shell pkg-config --libs libuv || echo "-luv")

SRC_DIR = .
OBJ_DIR = build
DIST_DIR = ../../dist/stdlib

SOURCES = $(SRC_DIR)/http_server.c $(SRC_DIR)/http_client.c
OBJECTS = $(patsubst $(SRC_DIR)/%.c,$(OBJ_DIR)/%.o,$(SOURCES))
TARGET = $(DIST_DIR)/libhttp.so

# Test
TEST_SRC = tests/http_test.c
TEST_BIN = $(OBJ_DIR)/http_test

.PHONY: all build test clean install

all: build test

build: $(TARGET)
	@echo "✅ stdlib/http built successfully"

$(OBJ_DIR):
	@mkdir -p $(OBJ_DIR)

$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) $(LIBUV_CFLAGS) -c $< -o $@

$(TARGET): $(OBJECTS) | $(DIST_DIR)
	$(CC) $(LDFLAGS) $(OBJECTS) $(LIBUV_LIBS) -o $@

test: $(TARGET) $(TEST_BIN)
	./$(TEST_BIN)

$(TEST_BIN): $(TEST_SRC) | $(OBJ_DIR)
	$(CC) $(CFLAGS) $(LIBUV_CFLAGS) $< -o $@ -L$(DIST_DIR) -lhttp $(LIBUV_LIBS)

clean:
	@rm -rf $(OBJ_DIR) $(TARGET)
	@echo "✅ Cleaned"

install: build
	@echo "✅ libhttp.so installed to $(DIST_DIR)"

.PHONY: libuv-check
libuv-check:
	@pkg-config --exists libuv && echo "✅ libuv found" || echo "❌ libuv not installed"
