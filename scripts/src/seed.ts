import { db, categoriesTable, suppliersTable, warehousesTable, partsTable, transactionsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const categories = await db.insert(categoriesTable).values([
    { name: "Процессоры", description: "CPU серверные процессоры" },
    { name: "Оперативная память", description: "DDR4/DDR5 серверные модули" },
    { name: "Накопители", description: "HDD, SSD, NVMe накопители" },
    { name: "Сетевые карты", description: "Ethernet и Fibre Channel адаптеры" },
    { name: "Блоки питания", description: "Серверные БП и UPS" },
    { name: "Системы охлаждения", description: "Вентиляторы, радиаторы" },
    { name: "Материнские платы", description: "Серверные системные платы" },
    { name: "Кабели и разъёмы", description: "Различные кабели и коннекторы" },
  ]).returning();

  const suppliers = await db.insert(suppliersTable).values([
    { name: "TechSupply Pro", contactPerson: "Иван Петров", email: "ivan@techsupply.ru", phone: "+7 495 123-45-67" },
    { name: "ServerParts RU", contactPerson: "Мария Сидорова", email: "maria@serverparts.ru", phone: "+7 812 987-65-43" },
    { name: "DataCenter Store", contactPerson: "Алексей Козлов", email: "alex@dc-store.ru", phone: "+7 499 555-11-22" },
  ]).returning();

  const warehouses = await db.insert(warehousesTable).values([
    { name: "Склад А (Основной)", location: "Москва, ул. Ленина, 1", description: "Основной склад запчастей" },
    { name: "Склад Б (Резервный)", location: "Москва, ул. Мира, 5", description: "Резервный склад" },
    { name: "Серверная комната 1", location: "Этаж 3, кабинет 301", description: "Локальный запас" },
  ]).returning();

  const parts = await db.insert(partsTable).values([
    {
      partNumber: "CPU-XEON-4210R",
      name: "Intel Xeon Silver 4210R",
      description: "10-ядерный серверный процессор, 2.4GHz",
      categoryId: categories[0].id,
      supplierId: suppliers[0].id,
      warehouseId: warehouses[0].id,
      quantity: 5,
      minQuantity: 2,
      unitPrice: "45000.00",
      unit: "шт",
      compatibleModels: "Dell PowerEdge R640, HPE ProLiant DL360",
    },
    {
      partNumber: "RAM-DDR4-16GB-3200",
      name: "Samsung DDR4 16GB 3200MHz ECC",
      description: "Серверный модуль памяти ECC Registered",
      categoryId: categories[1].id,
      supplierId: suppliers[0].id,
      warehouseId: warehouses[0].id,
      quantity: 24,
      minQuantity: 8,
      unitPrice: "8500.00",
      unit: "шт",
      compatibleModels: "Universal DDR4 ECC",
    },
    {
      partNumber: "SSD-SAMSUNG-3840-SAS",
      name: "Samsung PM1643 3.84TB SAS",
      description: "Enterprise SSD 12Gb/s SAS",
      categoryId: categories[2].id,
      supplierId: suppliers[1].id,
      warehouseId: warehouses[0].id,
      quantity: 8,
      minQuantity: 3,
      unitPrice: "75000.00",
      unit: "шт",
      compatibleModels: "Dell, HPE, Lenovo серверы",
    },
    {
      partNumber: "NIC-MELLANOX-25G-DUAL",
      name: "Mellanox ConnectX-5 25GbE Dual",
      description: "Двухпортовый 25GbE сетевой адаптер",
      categoryId: categories[3].id,
      supplierId: suppliers[2].id,
      warehouseId: warehouses[0].id,
      quantity: 1,
      minQuantity: 2,
      unitPrice: "35000.00",
      unit: "шт",
      compatibleModels: "PCIe x16",
    },
    {
      partNumber: "PSU-DELL-750W-PLAT",
      name: "Dell 750W Platinum PSU",
      description: "Блок питания 80 Plus Platinum",
      categoryId: categories[4].id,
      supplierId: suppliers[0].id,
      warehouseId: warehouses[1].id,
      quantity: 6,
      minQuantity: 4,
      unitPrice: "18000.00",
      unit: "шт",
      compatibleModels: "Dell PowerEdge R630, R640, R650",
    },
    {
      partNumber: "FAN-HPE-DL380-GEN10",
      name: "HPE Hot Plug Fan Kit DL380 Gen10",
      description: "Горячая замена вентилятора",
      categoryId: categories[5].id,
      supplierId: suppliers[1].id,
      warehouseId: warehouses[2].id,
      quantity: 12,
      minQuantity: 6,
      unitPrice: "4500.00",
      unit: "шт",
      compatibleModels: "HPE ProLiant DL380 Gen10",
    },
    {
      partNumber: "HDD-SEAGATE-4TB-SAS",
      name: "Seagate Exos 4TB 7200rpm SAS",
      description: "Серверный жёсткий диск SAS 12Gb/s",
      categoryId: categories[2].id,
      supplierId: suppliers[2].id,
      warehouseId: warehouses[0].id,
      quantity: 0,
      minQuantity: 5,
      unitPrice: "12000.00",
      unit: "шт",
      compatibleModels: "Universal SAS",
    },
    {
      partNumber: "RAM-DDR4-32GB-3200",
      name: "Micron 32GB DDR4 3200MHz ECC",
      description: "Серверный модуль памяти 32GB ECC Reg",
      categoryId: categories[1].id,
      supplierId: suppliers[0].id,
      warehouseId: warehouses[0].id,
      quantity: 16,
      minQuantity: 4,
      unitPrice: "16500.00",
      unit: "шт",
      compatibleModels: "Universal DDR4 ECC",
    },
  ]).returning();

  await db.insert(transactionsTable).values([
    {
      partId: parts[0].id,
      type: "receipt",
      quantity: 5,
      previousQuantity: 0,
      newQuantity: 5,
      unitPrice: "45000.00",
      reference: "PO-2024-001",
      notes: "Первичный приход",
    },
    {
      partId: parts[1].id,
      type: "receipt",
      quantity: 24,
      previousQuantity: 0,
      newQuantity: 24,
      unitPrice: "8500.00",
      reference: "PO-2024-002",
      notes: "Плановая закупка",
    },
    {
      partId: parts[0].id,
      type: "issue",
      quantity: 1,
      previousQuantity: 5,
      newQuantity: 4,
      reference: "REQ-2024-015",
      notes: "Замена в стойке №3",
    },
    {
      partId: parts[2].id,
      type: "receipt",
      quantity: 8,
      previousQuantity: 0,
      newQuantity: 8,
      unitPrice: "75000.00",
      reference: "PO-2024-003",
    },
    {
      partId: parts[6].id,
      type: "issue",
      quantity: 5,
      previousQuantity: 5,
      newQuantity: 0,
      reference: "REQ-2024-018",
      notes: "Замена вышедших из строя дисков",
    },
    {
      partId: parts[5].id,
      type: "receipt",
      quantity: 12,
      previousQuantity: 0,
      newQuantity: 12,
      unitPrice: "4500.00",
      reference: "PO-2024-004",
    },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
