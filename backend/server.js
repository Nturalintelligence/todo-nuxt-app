const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'super-secret-key';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Инициализация SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Модель Пользователя
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
});

// Модель Задачи
const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  dueDate: { type: DataTypes.STRING }
});

// Связь: Один пользователь - много задач
User.hasMany(Task, { onDelete: 'CASCADE' });
Task.belongsTo(User);

// Синхронизация БД
sequelize.sync().then(() => console.log('📦 Database & Tables created!'));

// Middleware для проверки токена
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// 1. Регистрация 
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password });
    res.status(201).json({ message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// 2. Логин 
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email, password } });
  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// 3. Получить задачи ТЕКУЩЕГО пользователя 
app.get('/api/tasks', authenticate, async (req, res) => {
  const tasks = await Task.findAll({ where: { UserId: req.userId } });
  res.json(tasks);
});

// 4. Создать задачу
app.post('/api/tasks', authenticate, async (req, res) => {
  const task = await Task.create({ ...req.body, UserId: req.userId });
  res.status(201).json(task);
});

// 5. Обновить задачу 
app.put('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await Task.findOne({ where: { id: req.params.id, UserId: req.userId } });
  if (task) {
    await task.update(req.body);
    return res.json(task);
  }
  res.status(404).json({ error: 'Not found' });
});

// 6. Удалить задачу 
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  const deleted = await Task.destroy({ where: { id: req.params.id, UserId: req.userId } });
  res.status(deleted ? 204 : 404).send();
});

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));