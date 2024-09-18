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
    // Проверяем наличие полей перед деструктуризацией
    const ma_email = body?.ma_email || '';
    const ma_name = body?.ma_name || '';
    const org = body?.org || '';
    const address = body?.address || '';
    const deadline = body?.deadline || '';
    const comment = body['Комментарий'] || '';
    
    // Проверяем, существует ли объект payment
    const payment = body?.payment || {};
    const amount = payment?.amount || 0;
    const products = payment?.products || [];

    // Проверяем наличие продуктов перед сортировкой
    const sortedProducts = products.length > 0 ? products.sort((a, b) => {
        const nameA = a.name ? a.name.toLowerCase() : '';
        const nameB = b.name ? a.name.toLowerCase() : '';

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    }) : [];

    // Вычисляем количество только если есть продукт
    const totalQuantity = sortedProducts.reduce((acc, cur) => acc + (cur.quantity || 0), 0);

    // Формируем сообщение, даже если данные неполные
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

    // Если есть продукты, добавляем их в сообщение
    sortedProducts.forEach((product, idx) => {
        message += `
          <tr>
            <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${idx + 1}</td>
            <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.name || ''}</td>
            <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.quantity || 0}</td>
            <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.price || 0}</td>
            <td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;padding: 5px;">${product.amount || 0}</td>
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

    // Отправка письма, даже если тело пустое или содержит только тестовые данные
    return new Promise((res, rej) => {
        transporter.sendMail({
            from: process.env.MAIL,
            to: process.env.TO,
            subject: `Заявка от ${org || 'неизвестной организации'} на ${deadline || 'неизвестную дату'}`,
            html: message
        }, (err, info) => {
            if (err) {
                rej();
                console.log(err);
            } else {
                res();
                console.log("Message sent: " + info.response);
            }
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