const express = require('express');
const multer = require('multer');
const AWS = require("aws-sdk");
require("dotenv").config();
const app = express();
const PORT = 3000;

AWS.config.update({
  region: process.env.AWS_REGION,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY
});

const converseToJson = multer();
const docClient = new AWS.DynamoDB.DocumentClient();
let countItem = 1;

app.use(express.json({ extended: true }));
app.use(express.static('./static'));
app.set('view engine', 'ejs');
app.set('views', './static/html');
app.use(function(req, res, next) {
  res.locals.query = req.query;
  res.locals.url = req.originalUrl;

  next();
});
app.use(converseToJson.fields([]));

app.get('/', (req, res) => {
  const params = {
    TableName: process.env.TABLE_NAME,
  };
  docClient.scan(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      res.send(JSON.stringify(err, null, 2));
    } else {
      countItem = data.Count;
      res.render('index', { title: "Hello AnhTuanIT", data });
    }
  });
});

app.get('/detail', (req, res) => {
  const id = req.query.id;
  if (!id) res.redirect('/');
  const params = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: "#id = :company_id",
    ExpressionAttributeNames: {
      "#id": "id"
    },
    ExpressionAttributeValues: {
      ":company_id": +id
    }
  };
  docClient.query(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      res.send(JSON.stringify(err, null, 2));
    } else {
      let products = data.Items[0].products ? data.Items[0].products : [];
      res.render('detail', { title: "Hello AnhTuanIT", data: products });
    }
  });
});

app.post('/add', (req, res) => {
  const { id, name, url } = req.body;
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id: Date.now(),
      name,
      url
    }
  };
  docClient.put(params, (err, data) => {
    if (err) {
      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      res.send(JSON.stringify(err, null, 2));
    } else {
      res.redirect('/');
    }
  });
});

app.get('/delete', (req, res) => {
  const id = req.query.id;
  if (!id) res.redirect('/');

  const onDeleteItem = (index) => {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: +id
      }
    };

    docClient.delete(params, (err, data) => {
      if (err) {
        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        res.send(JSON.stringify(err, null, 2));
      } else res.redirect('/');
    });
  }

  onDeleteItem(id);
});

app.get('/formsua', (req, res) => {
  res.render('formsua', { title: 'Cập nhật thông tin', query: req.query });
})

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server listening on port http://localhost:${process.env.PORT || PORT}`);
})