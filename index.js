const express = require('express');
const mysql = require('mysql');
const path = require('path');
const dbConfig = require('./config/db.js');
const connection = mysql.createConnection(dbConfig);

// Create a MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10, // Adjust the connection limit as needed
});

const app = express();
app.use(express.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "layout"));
app.use(express.static("public"));
app.set('port', process.env.PORT || 3003);

const formatDate = (date) => {
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
};

app.get("/", (req, res) => {
  let datas = [];
  let page = 1;
  if(req.query && req.query.page) {
    page = req.query.page;
  }
  const cntPerPage = 9;
  
  connection.query('SELECT COUNT(*) as total FROM article WHERE board_id = 1', (error, rows) => {
    if (error) throw error;

    let totalCnt = rows[0].total;
    let maxPage = Math.floor(totalCnt / cntPerPage) + ((totalCnt%cntPerPage)>0?1:0);

    console.log("Page", page, "maxPage", maxPage, "total", totalCnt);

    if (page < 0) {
       res.redirect("./?page=1");
    } else if (page > maxPage+1) {
       res.redirect("./?page="+maxPage);
    } else {
      connection.query(
        'SELECT * FROM article WHERE board_id = 1 ORDER BY article_id DESC LIMIT ?, ?',
        [(page - 1) * cntPerPage, cntPerPage],
        (error, rows) => {
          if (error) throw error;

          for(let i=0;i<rows.length;i++){
            let date = new Date(rows[i]['reg_date']);
            const dateStr = date.getFullYear() +"."+date.getMonth()+"."+date.getDate()+" "+date.getHours()+":"+date.getMinutes();

            datas.push({
              'id':rows[i]['article_id'],
              'date':dateStr,
              'title':rows[i]['title'],
              'content':rows[i]['content'],
            })
          }

          res.render('board/listPage', {
            "datas":datas,
            "cnt":datas. length,
            "prevPage":page-1>0?page-1:1,
            "nextPage":page+1>maxPage?maxPage:page+1,
          });
        }
      );
    }
  });
});

app.get("/test", (req, res) => {
  res.end("<html><head><title>Test Title</title></head><body><h1>Test</h1></body></html>");
});

app.get("/class", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/class.html"));
});

app.get("/view", (req, res) => {
  let articleId = req.query.id;
  connection.query("SELECT * FROM article WHERE board_id=1 and article_id = ?", [articleId], (error, rows)=>{
    if(error) throw error;

    let date = new Date(rows[0]['reg_date']);
    const dateStr = date.getFullYear() +"."+date.getMonth()+"."+date.getDate()+" "+date.getHours()+":"+date.getMinutes();
    let boardViewData = {
      title : rows[0]['title'],
      content : rows[0]['content'],
      date : dateStr,
      id : rows[0]['article_id'],
    };

    res.render('board/viewpage', {
      'article':boardViewData,
    })
  });
});

app.get("/write", (req, res) => {
  res.render('board/writepage');
})

app.post("/write", (req,res)=>{
  connection.query('SELECT * FROM board where board_id = 1', (error, rows) => {
     if(error) throw error;
     
     const dbCryptKey = rows[0]['crypt_key'];

     if(dbCryptKey == req.body.code) {
       let title = req.body.title;
       let content = req.body.content;
       connection.query("INSERT INTO article (board_id, title, content, reg_date) VALUES (1,?,?,?)",
        [title, content, new Date()], (error, rows) => {

          if(error) throw error;

          console.log("new data", new Date);

          res.redirect("/view?id="+rows.insertId);
        });
     }
     else {
      res.redirect("/write");
     }
  });
})

app.listen(app.get('port'), () => {
  console.log("Express server running on port", app.get('port'));
});
