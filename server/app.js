import express from 'express';
import axios from 'axios';
import 'dotenv/config'
const app = express();

const apiUrl = 'https://alexshlepin64.amocrm.ru/api/v4';

// Запуск сервера
app.listen(process.env.PORT, () => {
    console.log(`Сервер запущен на порту ${process.env.PORT}`);
  });  

app.get('/', async (req, res) => {
  const name = req.query.name;
  const email = req.query.email;
  const phone = req.query.phone;

  try {
    
    const responseData = await findContact(phone);

    const contactData = [
        {
            "first_name": `${name.split(' ')[0]}`,
            "last_name": `${name.split(' ')[1] ? name.split(' ')[1] : ''}`,
            "custom_fields_values": 
            [
                {
                    "field_code": "PHONE",
                    "values": 
                        [
                            {
                                "value": phone,
                                "enum_code": "WORK"
                            }
                        ]
                },
                {
                    "field_code": "EMAIL",
                    "values": [
                        {
                            "value": email,
                            "enum_code": "WORK"
                        }
                    ]
                }
            ]
        }
    ];

    let contactId = 0;
    if (!responseData) {
        contactId = await createContact(contactData); // Получаем id нового контакта
    } else {
        contactId = responseData._embedded.contacts[0].id;
        await updateContact(contactId, contactData);
    }

    await createDeal(contactId);

    res.status(200).json({ message: 'Выполнено успешно!' });
  } catch (error) {
    res.status(500).json({ error: 'Произошла ошибка при выполнении.' });
  }
});

// Функция для поиска контакта по телефону
async function findContact(phone) {
    try {
        const response1 = await axios.get(`${apiUrl}/contacts`, {
          params: {
            query: phone,
          },
          headers: {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response1.data) {
            const response2 = await axios.get(`${apiUrl}/contacts`, {
                params: {
                  query: email,
                },
                headers: {
                  'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
                  'Content-Type': 'application/json'
                }
            });
            return response2.data;

        }
        return response1.data;
      } catch (error) {
        console.error(error);
      }
}

// Функция для обновления контакта
async function updateContact(id, contactData) {
    contactData[0].id = id;
    const config = {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }
      };
    
      try {
        const response = await axios.patch(`${apiUrl}/contacts`, JSON.stringify(contactData), config);
        console.log(response.data);
      } catch (error) {
        console.log(error);
      }
}

// Функция для создания нового контакта
async function createContact(contactData) {
      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }
      };
    
      try {
        const response = await axios.post(`${apiUrl}/contacts`, JSON.stringify(contactData), config);
        console.log(response.data);
        return response.data._embedded.contacts[0].id;
      } catch (error) {
        console.log(error);
      }
}

// Функция для создания сделки по контакту
async function createDeal(contactId) {
    const dealData = [
        {
                "name": `${generateRandomNumber()}`,
                "_embedded": {
                        "contacts": [
                            {
                                "id": contactId
                            }
                        ]
                }
        }
    ];    
    const config = {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }
      };
    
      try {
        const response = await axios.post(`${apiUrl}/leads`, JSON.stringify(dealData), config);
        console.log(response.data);
      } catch (error) {
        console.log(error);
      }

}

function generateRandomNumber() {
    const min = 100000000;
    const max = 999999999;
  
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
    return randomNumber;
  }