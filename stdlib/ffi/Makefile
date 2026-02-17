# FreeLang FFI - Makefile
# Builds native bindings for libuv and system functions

CC = gcc
CFLAGS = -Wall -Wextra -fPIC -O2
LIBUV_FLAGS = `pkg-config --cflags libuv`
LIBUV_LIBS = `pkg-config --libs libuv`

# Output
LIB_NAME = libfreelang_ffi.so
OBJ = freelang_ffi.o

# Targets
.PHONY: all clean test

all: $(LIB_NAME)

$(LIB_NAME): $(OBJ)
	$(CC) -shared -o $@ $^ $(LIBUV_LIBS)

$(OBJ): freelang_ffi.c freelang_ffi.h
	$(CC) $(CFLAGS) $(LIBUV_FLAGS) -c freelang_ffi.c -o $@

clean:
	rm -f $(OBJ) $(LIB_NAME)

test: $(LIB_NAME)
	@echo "FFI library built: $(LIB_NAME)"
	@echo "Size: $$(du -h $(LIB_NAME) | cut -f1)"

install: $(LIB_NAME)
	cp $(LIB_NAME) /usr/local/lib/
	cp freelang_ffi.h /usr/local/include/

uninstall:
	rm -f /usr/local/lib/$(LIB_NAME)
	rm -f /usr/local/include/freelang_ffi.h
