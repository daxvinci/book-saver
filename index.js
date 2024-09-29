import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import axios from "axios";

const port = 3000;
const app = express()
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book",
    password: "Elvinci@911",
    port: 5433,
})
db.connect()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let books = [];
// let username;

app.get('/', async (req,res)=>{
    try{
        const result = await db.query("SELECT * FROM read_books")
        books = result.rows
        res.render('index.ejs',{
            savedBooks:books
        })
    }
    catch(error){
        console.log(error)
        books = []
        res.render('index.ejs',{
            savedBooks:books
        })
    }
    
})

app.get('/add', (req,res)=>{
    res.render('add.ejs')
})

app.post('/add', async (req,res)=>{
    const bookName = req.body.book_name
    if(bookName !== ''){
        try{
            const result = await axios.get('https://openlibrary.org/search.json',{
                headers:{
                     'User-Agent': 'Mini-project/book Saver (ebukaokoro40@yahoo.com)'
                },
                params:{
                    title:bookName,
                }
            })
            const fetched = result.data.docs
            // console.log('Book: ' + fetched[0].title)
            // console.log('Author: ' + fetched[0].author_name[0])
            // console.log('year: ' + fetched[0].publish_year[0])
            // console.log('Rating: ' + Number(fetched[0].ratings_average?.toFixed(2)))
            // console.log('isbn: ' + fetched[0].isbn[0])
            res.render('add.ejs',{
                books:fetched,
                number:result.data.num_found,
            })
        }
        catch(error){
            console.log(error.code)
            res.render('add.ejs',{
                error:'something went wrong'
            })
        }
    }else{
        res.render('add.ejs')
    }

})

app.get('/form', (req,res)=>{
    const details = req.query
    res.render('form.ejs',{
        addbook:details,
    })
})

app.post('/form', async(req,res)=>{
    const data = req.body
    try{
        const result = await db.query("INSERT INTO read_books(book,author,publish_year,rating,isbn,fake_user) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[data.book,data.author,data.year,data.rating,data.isbn,data.user])
        // const user = await db.query("INSERT INTO users(user) VALUES($1) RETURNING *")
        console.log(result)
        res.redirect('/')
    }
    catch(error){
        console.log(error)
        res.json(error)
    }
})

app.get('/edit', async(req,res)=>{
    const data = parseInt(req.query.id)
    const result = await db.query("SELECT * FROM read_books JOIN notes ON notes.book_id = read_books.id WHERE read_books.id = $1",[data])
    if(result.rows[0] != undefined){
        res.render('edit.ejs',{
            note:result.rows[0]
        })
    }else{
        res.render('edit.ejs',{
            bookId:data,
        })
    }
})

app.post('/edit', async (req, res) => {
    const data = req.body;

    try {
        // Check if the note exists
        const result = await db.query("SELECT * FROM notes WHERE id = $1", [data.noteId]);

        if (result.rows.length > 0) {
            // Note exists, update it
            const valuesBack = await db.query("UPDATE notes SET note = $1 WHERE id = $2 RETURNING *", [data.updatedNote, data.noteId]);
            const updateUser = await db.query("UPDATE read_books SET fake_user = $1 WHERE id = $2 RETURNING *", [data.user, result.rows[0].book_id]);
            console.log(valuesBack);
            console.log(updateUser);
        } else {
            // Note does not exist, insert new note
            const valuesBack = await db.query("INSERT INTO notes(note, book_id) VALUES($1, $2) RETURNING *", [data.newNote, data.bookId]);
            const newUser = await db.query("UPDATE read_books SET fake_user = $1 WHERE id = $2 RETURNING *", [data.user, data.bookId]);
            console.log(valuesBack);
            console.log(newUser);
        }
        
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
})


// app.post('/edit', async(req,res)=>{
//     const data = req.body
//     const result = await db.query("SELECT * FROM notes")
//     for(let i =0 ; i < result.rows.length ; i++){
//         if(result.rows[i].id == data.noteId){
//             const valuesBack = await db.query("UPDATE notes SET note = $1 WHERE book_id = $2 RETURNING *",[data.updatedNote,data.noteId])
//             const updateUser = await db.query("UPDATE read_books SET fake_user = $1 WHERE id = $2 RETURNING *",[data.user,data.noteId])
//             console.log(valuesBack)
//             console.log(updateUser)
//             res.redirect('/')
//             return
//         }
//     }
//     const valuesBack = await db.query("INSERT INTO notes(note,book_id) VALUES($1,$2) RETURNING *",[data.newNote,data.bookId])
//     const newUser = await db.query("UPDATE read_books SET fake_user = $1 WHERE id = $2 RETURNING *",[data.user,data.bookId])
//     console.log(valuesBack)
//     console.log(newUser)
//     res.redirect('/')
// })


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });