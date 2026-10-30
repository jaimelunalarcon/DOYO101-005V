const request = require("supertest");
const { app, setPool, initDb } = require("../server");

describe("API productos (Jest + Supertest, MySQL mockeado)", () => {
  let mockQuery;
  let consoleErrorSpy;

  beforeEach(() => {
    mockQuery = jest.fn();
    setPool({ query: mockQuery });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("GET /api/health", () => {
    it("responde estado ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "ok",
        message: "Backend de tienda de perritos en ejecución.",
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/productos", () => {
    it("lista productos correctamente", async () => {
      const productos = [
        { id: 2, nombre: "Snacks", descripcion: "Dental", precio: "5990.00", stock: 30 },
        { id: 1, nombre: "Premium", descripcion: "Pollo", precio: "19990.00", stock: 15 },
      ];
      mockQuery.mockResolvedValueOnce([productos]);

      const res = await request(app).get("/api/productos");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(productos);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT id, nombre, descripcion, precio, stock FROM productos ORDER BY id DESC"
      );
    });

    it("retorna 500 si falla la base de datos", async () => {
      mockQuery.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const res = await request(app).get("/api/productos");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "No se pudieron obtener los productos." });
    });
  });

  describe("GET /api/productos/:id", () => {
    it("retorna producto existente", async () => {
      const producto = {
        id: 1,
        nombre: "Premium",
        descripcion: "Pollo",
        precio: "19990.00",
        stock: 15,
      };
      mockQuery.mockResolvedValueOnce([[producto]]);

      const res = await request(app).get("/api/productos/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(producto);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = ?",
        ["1"]
      );
    });

    it("retorna 404 si no existe", async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const res = await request(app).get("/api/productos/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Producto no encontrado." });
    });

    it("retorna 500 si falla la base de datos", async () => {
      mockQuery.mockRejectedValueOnce(new Error("DB down"));

      const res = await request(app).get("/api/productos/1");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "No se pudo obtener el producto." });
    });
  });

  describe("POST /api/productos", () => {
    it("crea un producto correctamente", async () => {
      const creado = {
        id: 10,
        nombre: "Nuevo",
        descripcion: "Desc",
        precio: 1000,
        stock: 5,
      };
      mockQuery
        .mockResolvedValueOnce([{ insertId: 10 }])
        .mockResolvedValueOnce([[creado]]);

      const res = await request(app)
        .post("/api/productos")
        .send({ nombre: "Nuevo", descripcion: "Desc", precio: 1000, stock: 5 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(creado);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)",
        ["Nuevo", "Desc", 1000, 5]
      );
    });

    it("normaliza descripcion vacía a null", async () => {
      mockQuery
        .mockResolvedValueOnce([{ insertId: 11 }])
        .mockResolvedValueOnce([[{ id: 11, nombre: "X", descripcion: null, precio: 1, stock: 1 }]]);

      const res = await request(app)
        .post("/api/productos")
        .send({ nombre: "X", precio: 1, stock: 1 });

      expect(res.status).toBe(201);
      expect(mockQuery.mock.calls[0][1][1]).toBeNull();
    });

    it("valida campos obligatorios", async () => {
      const res = await request(app).post("/api/productos").send({ nombre: "Sin precio" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Nombre, precio y stock son obligatorios." });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("retorna 500 si falla la base de datos", async () => {
      mockQuery.mockRejectedValueOnce(new Error("insert fail"));

      const res = await request(app)
        .post("/api/productos")
        .send({ nombre: "X", precio: 1, stock: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "No se pudo crear el Producto." });
    });
  });

  describe("PUT /api/productos/:id", () => {
    it("actualiza un producto correctamente", async () => {
      const actualizado = {
        id: 1,
        nombre: "Editado",
        descripcion: "Nueva",
        precio: 2000,
        stock: 3,
      };
      mockQuery
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[actualizado]]);

      const res = await request(app)
        .put("/api/productos/1")
        .send({ nombre: "Editado", descripcion: "Nueva", precio: 2000, stock: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(actualizado);
    });

    it("retorna 404 si no existe", async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app)
        .put("/api/productos/999")
        .send({ nombre: "X", precio: 1, stock: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Producto no encontrado." });
    });

    it("valida campos obligatorios", async () => {
      const res = await request(app).put("/api/productos/1").send({ precio: 10 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Nombre, Precio y Stock son obligatorios." });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("retorna 500 si falla la base de datos", async () => {
      mockQuery.mockRejectedValueOnce(new Error("update fail"));

      const res = await request(app)
        .put("/api/productos/1")
        .send({ nombre: "X", precio: 1, stock: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "No se pudo actualizar el Producto." });
    });
  });

  describe("DELETE /api/productos/:id", () => {
    it("elimina un producto correctamente", async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete("/api/productos/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Producto eliminado correctamente." });
      expect(mockQuery).toHaveBeenCalledWith("DELETE FROM productos WHERE id = ?", ["1"]);
    });

    it("retorna 404 si no existe", async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).delete("/api/productos/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Producto no encontrado." });
    });

    it("retorna 500 si falla la base de datos", async () => {
      mockQuery.mockRejectedValueOnce(new Error("delete fail"));

      const res = await request(app).delete("/api/productos/1");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "No se pudo eliminar el Producto." });
    });
  });

  describe("initDb", () => {
    let prevUser;
    let prevPassword;
    let prevHost;
    let prevName;

    beforeEach(() => {
      prevUser = process.env.DB_USER;
      prevPassword = process.env.DB_PASSWORD;
      prevHost = process.env.DB_HOST;
      prevName = process.env.DB_NAME;
    });

    afterEach(() => {
      if (prevUser === undefined) delete process.env.DB_USER;
      else process.env.DB_USER = prevUser;
      if (prevPassword === undefined) delete process.env.DB_PASSWORD;
      else process.env.DB_PASSWORD = prevPassword;
      if (prevHost === undefined) delete process.env.DB_HOST;
      else process.env.DB_HOST = prevHost;
      if (prevName === undefined) delete process.env.DB_NAME;
      else process.env.DB_NAME = prevName;
    });

    it("crea el pool con mysql.createPool", async () => {
      process.env.DB_USER = "alumno";
      process.env.DB_PASSWORD = "test-password";
      process.env.DB_HOST = "db";
      process.env.DB_NAME = "tienda_perritos";

      const mysql = require("mysql2/promise");
      const fakePool = { query: jest.fn() };
      const createPoolSpy = jest.spyOn(mysql, "createPool").mockReturnValue(fakePool);
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await initDb();

      expect(createPoolSpy).toHaveBeenCalled();
      expect(createPoolSpy.mock.calls[0][0]).toMatchObject({
        user: "alumno",
        database: "tienda_perritos",
        connectionLimit: 10,
      });

      createPoolSpy.mockRestore();
      logSpy.mockRestore();
    });

    it("no crea pool si faltan credenciales", async () => {
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;

      const mysql = require("mysql2/promise");
      const createPoolSpy = jest.spyOn(mysql, "createPool");

      await initDb();

      expect(createPoolSpy).not.toHaveBeenCalled();
      createPoolSpy.mockRestore();
    });
  });
});
