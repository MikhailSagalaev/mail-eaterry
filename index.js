const nodemailer = require('nodemailer');
const Unisender = require('unisender');
require('dotenv').config();

// Настройка для Unisender
const unisender = new Unisender({
    api_key: process.env.UNISENDER_API_KEY
});

// Функция отправки email через Unisender
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
        const message = {
            email: process.env.TO,  // Адрес, на который отправляем письмо
            sender_name: 'Ваш Магазин',
            sender_email: process.env.MAIL,
            subject: 'Новый заказ',
            body: htmlContent
        };

        // Отправляем письмо через Unisender
        const response = await unisender.sendEmail(message);
        console.log('Message sent:', response);

        // Отправка письма покупателю
        if (customerEmail) {
            const customerMessage = {
                email: customerEmail,  // Email покупателя
                sender_name: 'Ваш Магазин',
                sender_email: process.env.MAIL,
                subject: 'Подтверждение вашего заказа',
                body: htmlContent
            };

            const customerResponse = await unisender.sendEmail(customerMessage);
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

    // Проверяем, есть ли payment, иначе не отправляем
    if (payment && payment.products) {
        sendEmail(payment, org, address, comment, deadline, ma_email);
    }

    res.status(200).send('OK');
});