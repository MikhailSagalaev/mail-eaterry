const nodemailer = require('nodemailer');
require('dotenv').config();

// Настройка транспорта для SMTP Яндекса
const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true, // true для 465, false для других портов
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASSWORD
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
            from: `"Ваш Магазин" <${process.env.MAIL}>`,
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
                from: `"Ваш Магазин" <${process.env.MAIL}>`,
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

    // Проверяем, есть ли payment, иначе не отправляем
    if (payment && payment.products) {
        sendEmail(payment, org, address, comment, deadline, ma_email);
    }

    res.status(200).send('OK');
});
