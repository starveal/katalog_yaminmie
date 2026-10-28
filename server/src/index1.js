const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.send("hello dari server!");
});

app.get('/api/produk', (req,res) => {
    const produk = [
        {
            id: 1, nama: 'mie yamin',
            harga: 20000
        },{
            id: 5, nama: 'bakso',
            harga: 15000
        }
    ];
    res.json(produk);
})

app.listen(port, () => {
    console.log(`server berhasil berjalan di http//localhost:${port}`);
}
);
