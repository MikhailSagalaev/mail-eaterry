const express = require('express');
const app = express();
require('dotenv').config();
const nodemailer = require('nodemailer');

// Конфигурация почтового транспортера
const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASSWORD
    }
});

// Middleware для обработки JSON
app.use(express.json());

// Функция для отправки email
const sendEmail = async (body) => {
    try {
        // Деструктуризация данных с проверкой
        const { ma_email, ma_name, org, address, deadline, payment } = body;

        // Если объект payment отсутствует или не содержит products или amount
        if (!payment || !payment.products || !payment.amount) {
            throw new Error('Payment data is missing or incomplete');
        }

        const { amount, products } = payment;
        const comment = body['Комментарий'] || ''; // Обработка необязательного комментария
        
        // Сортировка продуктов по названию
        const sortedProducts = products.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        
        // Подсчет общего количества продуктов
        const totalQuantity = sortedProducts.reduce((acc, cur) => acc + cur.quantity, 0);
        
        // Формирование HTML-сообщения
        let message = `
            <h2>Информация о покупателе:</h2>
            <p style="font-size: 20px">
                <span style="margin: 5px 0">email: ${ma_email}</span> <br/>
                <span style="margin: 5px 0">name: ${ma_name}</span> <br/>
                <span style="margin: 5px 0">org: ${org}</span> <br/>
                <span style="margin: 5px 0">address: ${address}</span> <br/>
                <span style="margin: 5px 0">comment: ${comment}</span> <br/>
                <span style="margin: 5px 0">deadline: ${deadline}</span> <br/>
            </p>
            <table style="margin-top: 30px;width: 100%;border-collapse: collapse;">
                <thead>
                    <th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> # </th>
                    <th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Название </th>
                    <th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Кол-во </th>
                    <th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Цена (РУБ)</th>
                    <th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Сумма (РУБ) </th>
                </thead>
        `;
        
        sortedProducts.forEach((product, idx) => {
            message += `
                <tr>
                    <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${idx + 1}</td>
                    <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.name}</td>
                    <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.quantity}</td>
                    <td style="border-top: 1px solid #dddddd;border-bottom: 1px солид #dddddd;padding: 5px;">${product.price}</td>
                    <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.amount}</td>
                </tr>
            `;
        });
        
        message += `
            <tr>
                <td></td>
                <td></td>
                <td style="font-size: 24px; font-weight: bold; padding: 20px 10px">КОЛ-ВО БЛЮД: ${totalQuantity}</td>
                <td></td>
                <td style="font-size: 24px; font-weight: bold; text-align: right; padding: 20px 10px">ИТОГО: ${amount} РУБ</td>
            </tr>
        </table>`;
        
        // Отправка письма
        await transporter.sendMail({
            from: process.env.MAIL,
            to: process.env.TO,
            subject: `Заявка от ${org} на ${deadline}`,
            html: message
        });
    } catch (error) {
        // Логирование ошибки и выброс исключения
        console.error('Ошибка при отправке письма:', error);
        throw new Error('Email sending failed');
    }
};

// Маршрут для проверки сервера
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Маршрут для обработки POST-запросов и отправки email
app.post('/', async (req, res) => {
    try {
        // Проверка на наличие данных в запросе
        if (!req.body || !req.body.payment || !req.body.payment.products) {
            return res.status(400).json({ message: 'Invalid request body: missing payment or products' });
        }

        // Вызов функции отправки email
        await sendEmail(req.body);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        // Возвращение статуса 500 в случае ошибки
        res.status(500).json({ message: 'Error sending email', error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
