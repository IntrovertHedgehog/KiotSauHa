This is a fork from [tngoman/Store-POS](https://github.com/tngoman/Store-POS)

# Store Point of Sale

Desktop Point of Sale app built with electron

**Features:**

- Can be used by multiple PC's on a network with one central database.
- Receipt Printing.
- Search for product by barcode.
- Staff accounts and permissions.
- Products and Categories.
- Basic Stock Management.
- Open Tabs (Orders).
- Customer Database.
- Transaction History.
- Filter Transactions by Till, Cashier or Status.
- Filter Transactions by Date Range.

**To use on Windows:**
[Download](http://www.storepointofsale.com/download/v1/StorePOS.msi) the MSI Installer

The default username and password is admin:sauha3719542

**Looking for a Desktop Invoicing app?**

Check out the [Offline Invoicing](https://github.com/tngoman/Offline_Invoicing) app for freelancers.

**To Customize/Create your own installer**

- Clone this project.
- Open terminal and navigate into the cloned folder.
- Run "npm install" to install dependencies.
- Run "npm run electron".

![POS](https://github.com/tngoman/Store-POS/blob/master/screenshots/pos.jpg)

![Transactions](https://github.com/tngoman/Store-POS/blob/master/screenshots/transactions.jpg)

![Receipt](https://github.com/tngoman/Store-POS/blob/master/screenshots/receipt.jpg)

![Permissions](https://github.com/tngoman/Store-POS/blob/master/screenshots/permissions.jpg)

![Users](https://github.com/tngoman/Store-POS/blob/master/screenshots/users.jpg)

# TODO

- [ ] translate to vietnamese (90%)
  - [x] receipt
  - [ ] datatables
- [x] implement proper barcode (incl when add product, display it, and search for it when making purchase)
- [x] trasaction export
- [x] make search fuzzy, and/or language proof
  - [x] for product search
  - [x] during check out
- [x] transction mistake cash and card
- [x] proper user system
  - [x] hash the password -> use it properly from front end
  - [x] better api code response and error
  - [x] auth endpoints
- [x] product:
  - [x] allow empty barcode
  - [x] reformat price
  - [ ] with best before date - input and sort by it in prod list, filter by close to expire dates
  - [ ] tiered discount
  - [x] when scanned product with multiple skuCode, pop out to reduce 
- [x] handle no data:
  - [x] reset all visible fields
  - [x] notify at closest element
