const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Создание экземпляра приложения Express
const app = express();
app.use(express.json());

// Логирование переменных окружения
console.log('YANDEX_EMAIL:', process.env.YANDEX_EMAIL);
console.log('YANDEX_PASSWORD:', process.env.YANDEX_PASSWORD);
console.log('TO:', process.env.TO);
console.log('MAIL:', process.env.MAIL);

// Настройка транспорта для SMTP Яндекса
const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true, // true для 465, false для других портов
    auth: {
        user: process.env.YANDEX_EMAIL,
        pass: process.env.YANDEX_PASSWORD
    }
});

// Функция отправки email через SMTP Яндекса
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

        // Настройки письма
        const mailOptions = {
            from: `"Ваш Магазин" <${process.env.YANDEX_EMAIL}>`,
            to: process.env.TO,  // Адрес, на который отправляем письмо
            subject: 'Новый заказ',
            html: htmlContent
        };

        // Отправляем письмо через SMTP Яндекса
        const response = await transporter.sendMail(mailOptions);
        console.log('Message sent:', response);

        // Отправка письма покупателю
        if (customerEmail) {
            const customerMailOptions = {
                from: `"Ваш Магазин" <${process.env.YANDEX_EMAIL}>`,
                to: customerEmail,  // Email покупателя
                subject: 'Подтверждение вашего заказа',
                html: htmlContent
            };

            const customerResponse = await transporter.sendMail(customerMailOptions);
            console.log('Message sent to customer:', customerResponse);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Пример обработчика POST-запроса (добавьте в свою экспресс-апп)
app.post('/webhook', (req, res) => {
    const { org, address, comment, deadline, payment, ma_email } = req.body;

    // Логируем тело запроса
    console.log('Request Body: ', req.body);

    // Проверяем, есть ли все необходимые поля
    if (!org || !address || !comment || !deadline || !payment || !payment.products) {
        console.error('Missing required fields in request body');
        return res.status(400).send('Missing required fields');
    }

    // Проверяем, есть ли payment, иначе не отправляем
    if (payment && payment.products) {
        sendEmail(payment, org, address, comment, deadline, ma_email);
    }

    res.status(200).send('OK');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
