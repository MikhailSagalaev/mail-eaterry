const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json()); // Для парсинга JSON данных

// Функция для отправки email через Unisender
const sendEmail = async (body) => {
    const { ma_email, ma_name, org, address, deadline, payment } = body;
    const comment = body['Комментарий'] || '';

    const message = `
      <h2>Информация о покупателе:</h2>
      <p>Email: ${ma_email}</p>
      <p>Имя: ${ma_name}</p>
      <p>Организация: ${org}</p>
      <p>Адрес: ${address}</p>
      <p>Комментарий: ${comment}</p>
      <p>Дедлайн: ${deadline}</p>
    `;

    // Формирование данных для запроса к Unisender API
    const data = {
        api_key: process.env.UNISENDER_API_KEY,
        email: process.env.TO,            // Кому отправляется письмо
        sender_name: org,                 // Отправитель
        sender_email: process.env.MAIL,   // Email отправителя
        subject: `Заявка от ${org} на ${deadline}`, // Тема письма
        body: message,                    // Содержание письма
        list_id: 'your_list_id'           // ID списка рассылки в Unisender
    };

    try {
        const response = await axios.post('https://api.unisender.com/ru/api/sendEmail', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Проверка на успешность отправки
        if (response.data.result) {
            console.log('Email успешно отправлен');
        } else {
            console.error('Ошибка отправки email:', response.data);
        }
    } catch (error) {
        console.error('Ошибка при отправке email:', error);
    }
};

// Обработчик для проверки работы сервера
app.get('/', (req, res) => {
    res.send('Сервер работает');
});

// Обработчик webhook запросов
app.post('/webhook', async (req, res) => {
    console.log('Request Body: ', req.body); // Логирование запроса
    try {
        await sendEmail(req.body); // Отправка email через Unisender
        res.status(200).send('Email отправлен');
    } catch (error) {
        res.status(500).send('Ошибка при отправке email');
    }
});

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
