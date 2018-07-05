if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('Node environment:', process.env.NODE_ENV);
