const express = require('express');
const app = express();
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASSWORD
    }
});

app.use(express.json());

const sendEmail = async (body) => {
    // Проверяем наличие всех данных перед деструктуризацией
    const {
        ma_email = 'Не указан email',
        ma_name = 'Не указано имя',
        org = 'Не указана организация',
        address = 'Не указан адрес',
        deadline = 'Не указана дата'
    } = body;

    const comment = body['Комментарий'] || 'Комментарий отсутствует';

    // Проверка на наличие payment и его полей
    const payment = body.payment || {}; // если payment отсутствует, установим пустой объект
    const products = payment.products || []; // если products отсутствует, установим пустой массив
    const amount = payment.amount || 0; // если amount отсутствует, установим 0

    // Сортируем продукты по имени (если они есть)
    const sortedProducts = products.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    const totalQuantity = sortedProducts.reduce((acc, cur) => acc + (cur.quantity || 0), 0);

    // Формируем HTML-сообщение
    let message = (
        `<h2>Информация о покупателе:</h2>` +
        `<p style="font-size: 20px">
            <span style="margin: 5px 0">email: ${ma_email}</span><br/>
            <span style="margin: 5px 0">name: ${ma_name}</span><br/>
            <span style="margin: 5px 0">org: ${org}</span><br/>
            <span style="margin: 5px 0">address: ${address}</span><br/>
            <span style="margin: 5px 0">comment: ${comment}</span><br/>
            <span style="margin: 5px 0">deadline: ${deadline}</span><br/>
        </p>` +
        '<table style="margin-top: 30px;width: 100%;border-collapse: collapse;">' +
        '<thead>' +
        '<th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> # </th>' +
        '<th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Название </th>'  +
        '<th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Кол-во </th>'  +
        '<th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Цена (РУБ)</th>'  +
        '<th style="text-align: left;font-weight: bold;padding: 5px;background: #efefef;border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;"> Сумма (РУБ) </th>'  +
        '</thead>'
    );

    sortedProducts.forEach((product, idx) => {
        message += (
            '<tr>' +
            `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${idx + 1}</td>` +
            `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.name || 'Не указано'}</td>` +
            `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.quantity || 0}</td>` +
            `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.price || 0}</td>` +
            `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.amount || 0}</td>` +
            '</tr>'
        );
    });

    message += (
        '<tr>' +
        `<td></td><td></td>` +
        `<td style="font-size: 24px; font-weight: bold; padding: 20px 10px">КОЛ-ВО БЛЮД: ${totalQuantity}</td>` +
        `<td></td>` +
        `<td style="font-size: 24px; font-weight: bold; text-align: right; padding: 20px 10px">ИТОГО: ${amount} РУБ</td>` +
        '</tr>'
    );

    return new Promise((res, rej) => {
        transporter.sendMail({
            from: process.env.MAIL,
            to: process.env.TO,
            subject: `Заявка от ${org} на ${deadline}`,
            html: message
        }, (err, info) => {
            if (err) {
                rej();
                return console.log(err);
            }
            res();
            console.log("Message sent " + info.response);
        });
    });
};

app.get('/', (req, res) => {
    res.send('ok');
});

app.post('/', async (req, res) => {
    try {
        console.log("Request Body: ", req.body); // Логируем тело запроса
        await sendEmail(req.body);
        res.send('ok');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error');
    }
});


app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running...');
});

module.exports = app;