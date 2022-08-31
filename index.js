const express = require('express');
const app = express();
require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASSWORD
    }
})

app.use(express.json());

const sendEmail = async (body) => {
    const {ma_email, ma_name, org, address, deadline, payment} = body
    const {amount, products} = payment
    const comment = body['Комментарий']
    const sortedProducts = products.sort((a, b) => {
        const nameA = a.name.toLowerCase(),
              nameB = b.name.toLowerCase()

        if (nameA < nameB)
            return -1
        if (nameA > nameB)
            return 1
        return 0
    })
    const totalQuantity = sortedProducts.reduce((acc, cur) => {
      return acc + cur.quantity
    }, 0)

    let message = (
      `<h2>Информация о покупателе:</h2>` +
      `<p style="font-size: 20px">
        <span style="margin: 5px 0">email: ${ma_email}</span> <br/>
        <span style="margin: 5px 0">name: ${ma_name}</span> <br/>
        <span style="margin: 5px 0">org: ${org}</span> <br/>
        <span style="margin: 5px 0">address: ${address}</span> <br/>
        <span style="margin: 5px 0">comment: ${comment}</span> <br/>
        <span style="margin: 5px 0">deadline: ${deadline}</span> <br/>
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

    for(const idx in sortedProducts) {
        message += (
          '<tr>' +
          `<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;;padding: 5px;">${+idx + 1}</td>` +
          '<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;;padding: 5px;">' + sortedProducts[idx].name + '</td>' +
          '<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;;padding: 5px;">' + sortedProducts[idx].quantity + '</td>' +
          '<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;;padding: 5px;">' + sortedProducts[idx].price + '</td>' +
          '<td style="border-top: 1px solid #dddddd;border-bottom: 1px solid #dddddd;;padding: 5px;">' + sortedProducts[idx].amount + '</td>' +
          '</tr>'
        );
    }

    message+=
      '<tr>' +
      `<td></td>` +
      '<td>' + '</td>' +
      '<td style="font-size: 24px; font-weight: bold; padding: 20px 10px">' + `КОЛ-ВО БЛЮД: ${totalQuantity}` + '</td>' +
      '<td>' + '</td>' +
      '<td style="font-size: 24px; font-weight: bold; text-align: right; padding: 20px 10px">' + `ИТОГО: ${amount} РУБ` + '</td>' +
      '</tr>'

    return new Promise((res, rej) => {
        transporter.sendMail({
            from: process.env.MAIL,
            to: process.env.TO,
            subject: `Заявка от ${org} ${deadline}`,
            html: message
        }, (err, info) => {
            if(err) {
                rej()
                return console.log(err);
            }
            res()
            console.log("Message sent "+info.response)
        })
    })
}


app.get('/', (req, res) => {
    res.send('ok')
})

app.post('/',   async(req, res) => {
    await sendEmail(req.body)
    res.send('ok')
})

app.listen(process.env.PORT || 3000);

module.exports = app;