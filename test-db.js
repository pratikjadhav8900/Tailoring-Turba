const { Client } = require('pg');

const url = 'postgresql://neondb_owner:npg_GmgPV2YTpDy1@ep-long-haze-ammpfljz.us-east-2.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: url,
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query result:', res.rows);
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    client.end();
  });
