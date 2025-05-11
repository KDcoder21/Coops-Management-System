if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mysql = require('mysql');
const bodyparser = require('body-parser');
const dotenv = require('dotenv');

var port = process.env.PORT || 5000;
app.use(bodyparser.json());

var mysqlConnection = mysql.createConnection({
  host:'localhost',
  user: process.env.db_user_name,
  password: process.env.db_password,
  database: process.env.db_name
});

mysqlConnection.connect((err)=>{
  if(!err)
  console.log('DB connection succeeded')
  else
  console.log('DB connection failed \n Error :' + JSON.stringify(err,undefined,2));
})

const users = []
const hashpas = bcrypt.hash(process.env.login_password, 10)
  users.push({
    id: Date.now().toString(),
    name: 'Admin',
    email: process.env.login_id,
    password: hashpas
  })


const initializePassport = require('./passport-config')
const e = require('express')
initializePassport(
  
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)


app.use( express.static( "public" ) )
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  let sql1 = 'SELECT SUM(Quantity_In_Stock) AS TotalItemsOrdered FROM Product';

  let query1= mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1){
    // res.render('index.ejs',{
    //   orders:rows
    // });
    console.log('Fetched total amount from ordersdb')
    total_sales = rows1
    console.log(typeof(rows1))

    let sql2 = 'SELECT COUNT(SKU) AS NumberOfProducts FROM Product';

    let query2= mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
      if(!err2){
      ord_num = rows2
      console.log('Fetched total no. of orders from ordersdb')

      let sql3 = 'SELECT SUM(Price*Quantity_In_Stock) AS TotalItemsOrdered FROM Product';

      let query3= mysqlConnection.query(sql3, (err3, rows3, fields3)=>{
      if(!err3){
      // res.render('index.ejs',{
      //   orders:rows
      // });
      console.log('Fetched total no. of stocks from stockdb')
      stock_num = rows3

      let sql4 = 'SELECT COUNT(Employee_Id) AS TotalEmployees FROM Employee';
      let query4= mysqlConnection.query(sql4, (err4, rows4, fields4)=>{
        if(!err3){
          total_stock = rows4
          res.render('index.ejs',{
            total_sales:rows1,
            ord_num:rows2,
            stock_num:rows3,
            total_stock:rows4
            });
        }
        else
        console.log(err4);
    
      });
    }
    else
    console.log(err3);
  });

      }
      else
      console.log(err2);
    });


    }
    else
    console.log(err1);
  });
  // res.render('index.ejs', { name: req.user.name })



  
  // console.log(total_sales)
  // console.log(ord_num)
  // console.log(stock_num)
  
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register1', checkNotAuthenticated, (req, res) => {
  res.render('register1.ejs')
})

app.post('/register1', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    console.log(users)
    res.redirect('/login')
  } catch {
    res.redirect('/register1')
  }
})

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
  console.log(users)
});



function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/register1')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(port, ()=>console.log(`Express Server is running at ${port} port`))


//View Stocks
app.get('/viewstocks', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Product';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewstocks.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})

//View Supplied
app.get('/viewsupplied', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Supplied';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewsupplied.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})

//Add Stocks
app.get('/stocks',checkAuthenticated,(req, res) => {
  let sql1 = 'SELECT * FROM Product'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var prod = rows1
      
              console.log(typeof(prod))
              console.log(prod)
              res.render('stocks.ejs',{prod:prod})
            }
            
    else
    console.log(err1)

  
})
})



//Submit Stock
app.post('/submitstock',checkAuthenticated,(req, res) => {
  console.log(req.body)
  const {number1,SKU,Product_Name,Price,Descrip,Quantity_In_Stock,Category,Expiration_Date,Location_In_Store,Reorder_Level,Discount_Information} = req.body;

  let sql = 'INSERT INTO Product(SKU, Product_Name, Price, Descrip, Quantity_In_Stock, Category, Expiration_Date,Location_In_Store, Reorder_Level, Discount_Information) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?) ';
// WHERE Supplier_Id exists;
let query = mysqlConnection.query(sql, [SKU, Product_Name, Price, Descrip, Quantity_In_Stock, Category, Expiration_Date, Location_In_Store, Reorder_Level, Discount_Information], (err, rows, fields) => {
    if (!err) {
        console.log('Successfully inserted values');
    } else {
        console.log(err);
    }
});


  
res.redirect('/viewstocks');

})

//Delete Stock
app.post('/deletestock', checkAuthenticated,(req,res) => {
  console.log('deleteitem called')
  var deleteid = req.body.deleteid
  // let sql1 = 'DELETE FROM Supplied WHERE SKU = ?'
  // let query1 = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
  //   if(!err)
  //   {
  //   console.log('Successfully deleted a value form supplied')
  //   }
  //   else
  //   console.log(err);
  // });
  let sql = 'DELETE FROM Product WHERE SKU = ?'
  let query = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
    if(!err)
    {
    console.log('Successfully deleted a value')
    res.redirect('/viewstocks')
    
    }
    else
    console.log(err);
  });
  
})

//View Employee
app.get('/viewemployees', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Employee';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewemployees.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})

//Add Employees
app.get('/employees',checkAuthenticated,(req, res) => {
  let sql1 = 'SELECT * FROM Employee'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var empl = rows1
      
              console.log(typeof(empl))
              console.log(empl)
              res.render('employees.ejs',{empl:empl})
            }
            
    else
    console.log(err1)

  
})
})

//Submit Employee
app.post('/submitemployee',checkAuthenticated,(req, res) => {
  console.log(req.body)
  const {EID,First_Name,Last_Name,Address,ph_no,email,title,start_date,salary} = req.body;

  let sql = 'INSERT INTO Employee(Employee_Id,First_Name,Last_Name,Address,Phone_Number,Email,Job_Title,Employment_Start_Date,Salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

let query = mysqlConnection.query(sql, [EID,First_Name,Last_Name,Address,ph_no,email,title,start_date,salary], (err, rows, fields) => {
    if (!err) {
        console.log('Successfully inserted values');
        res.redirect('/viewemployees');
    } else {
        console.log(err);
    }
});
})

//Delete Employee
app.post('/deleteemployee', checkAuthenticated,(req,res) => {
  console.log('delete employee called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM Employee WHERE Employee_Id = ?'
  let query = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
    if(!err)
    {
    console.log('Successfully deleted employee')
    res.redirect('/viewemployees')
    
    }
    else
    console.log(err);
  });
})

//View Supplier
app.get('/viewsuppliers', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Supplier';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewsuppliers.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})

//Add Suppliers
app.get('/suppliers',checkAuthenticated,(req, res) => {
  let sql1 = 'SELECT * FROM Supplier'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var suppl = rows1
      
              console.log(typeof(suppl))
              console.log(suppl)
              res.render('suppliers.ejs',{suppl:suppl})
            }
            
    else
    console.log(err1)

  
})
})

//Submit Supplier
app.post('/submitsupplier',checkAuthenticated,(req, res) => {
  console.log(req.body)
  console.log(122);
  const {SID,Name,Contact_Name,Email,ph_no,Address,Phy_terms} = req.body;

  let sql = 'INSERT INTO Supplier(Supplier_Id,Supplier_Name,Contact_Person,Contact_Email,Contact_Phone_Number,Address,Physical_Terms) VALUES (?, ?, ?, ?, ?, ?, ?)';

let query = mysqlConnection.query(sql, [SID,Name,Contact_Name,Email,ph_no,Address,Phy_terms], (err, rows, fields) => {
    if (!err) {
        console.log('Successfully inserted values');
        res.redirect('/viewsuppliers');
    } else {
        console.log(err);
    }
});
})

//Delete Supplier
app.post('/deletesupplier', checkAuthenticated,(req,res) => {
  console.log('delete Supplier called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM Supplier WHERE Supplier_Id = ?'
  let query = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
    if(!err)
    {
    console.log('Successfully deleted Supplier')
    res.redirect('/viewsuppliers')
    
    }
    else
    console.log(err);
  });
})

//View Member
app.get('/viewmembers', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Member';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewmembers.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})

//Add Members
app.get('/members',checkAuthenticated,(req, res) => {
  let sql1 = 'SELECT * FROM Member'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var mem = rows1
      
              console.log(typeof(mem))
              console.log(mem)
              res.render('members.ejs',{mem:mem})
            }
            
    else
    console.log(err1)

  
})
})

//Submit Member
app.post('/submitmember',checkAuthenticated,(req, res) => {
  console.log(req.body)
  console.log(122);
  const {FName,LName,dob,Address,ph_no,Email,mem_type,mem_status} = req.body;

  let sql = 'INSERT INTO Member(First_Name,Last_Name,Date_Of_Birth,Address,Phone_Number,Email,Membership_Type,Membership_Status) VALUES ( ?, ?, ?, ?, ?, ?,?,?)';

let query = mysqlConnection.query(sql, [FName,LName,dob,Address,ph_no,Email,mem_type,mem_status], (err, rows, fields) => {
    if (!err) {
        console.log('Successfully inserted values into member');
        res.redirect('/viewmembers');
    } else {
        console.log(err);
    }
});
})

//Delete Member
app.post('/deletemember', checkAuthenticated,(req,res) => {
  console.log('delete member called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM Member WHERE Member_Id = ?'
  let query = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
    if(!err)
    {
    console.log('Successfully deleted Member')
    res.redirect('/viewmembers')
    
    }
    else
    console.log(err);
  });
})

app.get('/reorder', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT SKU,Product_Name,Quantity_In_Stock,Reorder_Level FROM Product WHERE Quantity_In_Stock<Reorder_Level';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('reorder.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})


//update product details
//add supplied
app.get('/supplied',checkAuthenticated,(req, res) => {
  let sql1 = 'SELECT * FROM Supplied'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var mem = rows1
      
              console.log(typeof(mem))
              console.log(mem)
              res.render('supplied.ejs',{mem:mem})
            }
            
    else
    console.log(err1)

  
})
})

//Submit supplied
app.post('/submitsupplied',checkAuthenticated,(req, res) => {
  console.log(req.body)
  console.log(122);
  const {SKU,Supplier_Id} = req.body;

  let sql = 'INSERT INTO Supplied(SKU,Supplier_Id) VALUES ( ?, ?)';

let query = mysqlConnection.query(sql, [SKU,Supplier_Id], (err, rows, fields) => {
    if (!err) {
        console.log('Successfully inserted values into supplied');
        res.redirect('/viewsupplied');
    } else {
        console.log(err);
    }
});
})
//view product suggestions
app.get('/viewsug', checkAuthenticated,(req,res) =>{
  let sql = 'SELECT * FROM Product_Suggestion';

  let query = mysqlConnection.query(sql, (err, rows, fields)=>{
    if(!err){
      
              res.render('viewsug.ejs',{
                all_stocks:rows,display_content:'None', filter_type:'None', filter_name:'None'
                  });
              }
          
    else
    console.log(err);
  });
})
