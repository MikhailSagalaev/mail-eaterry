const axios = require('axios');
require('dotenv').config();

// Функция отправки email через UniSender
async function sendEmail(payment, org, address, comment, deadline, customerEmail) {
    try {
        // Сортируем продукты по алфавиту
        const sortedProducts = payment.products.sort((a, b) => a.name.localeCompare(b.name));

        // Формируем HTML-контент для письма
        const htmlContent = `
            <h2>Заказ от ${org}</h2>
            <p><strong>Адрес:</strong> ${address}</p>
            <p><strong>Комментарий:</strong> ${comment}</p>
            <p><strong>Крайний срок:</strong> ${deadline}</p>
            <p><strong>Состав заказа:</strong></p>
            <ul>
                ${sortedProducts.map(product => `<li>${product.name} - ${product.quantity}</li>`).join('')}
            </ul>
            <p><strong>Общая сумма:</strong> ${payment.amount} руб.</p>
        `;

        // Настройки письма для владельца
        const ownerMessage = {
            api_key: process.env.UNISENDER_API_KEY,
            email: process.env.TO,  // Адрес владельца
            sender_name: 'Ваш Магазин',
            sender_email: process.env.MAIL,  // Email отправителя
            subject: 'Новый заказ',
            body: htmlContent,
            list_id: process.env.UNISENDER_LIST_ID // Если у вас используется список контактов
        };

        // Отправляем письмо владельцу через UniSender
        const ownerResponse = await axios.post('https://api.unisender.com/ru/api/sendEmail', ownerMessage);
        console.log('Message sent to owner:', ownerResponse.data);

        // Отправка письма покупателю
        if (customerEmail) {
            const customerMessage = {
                api_key: process.env.UNISENDER_API_KEY,
                email: customerEmail,  // Email покупателя
                sender_name: 'Ваш Магазин',
                sender_email: process.env.MAIL,
                subject: 'Подтверждение вашего заказа',
                body: htmlContent,
                list_id: process.env.UNISENDER_LIST_ID // Если у вас используется список контактов
            };

            const customerResponse = await axios.post('https://api.unisender.com/ru/api/sendEmail', customerMessage);
            console.log('Message sent to customer:', customerResponse.data);
        }

    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.data : error.message);
    }
}

// Пример обработчика POST-запроса
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
    const { org, address, comment, deadline, payment, ma_email } = req.body;

    // Логируем тело запроса
    console.log('Request Body: ', req.body);

    // Проверяем, есть ли payment, иначе не отправляем
    if (payment && payment.products) {
        sendEmail(payment, org, address, comment, deadline, ma_email);
    }

    res.status(200).send('OK');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
