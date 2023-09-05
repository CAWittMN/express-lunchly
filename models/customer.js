/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         middle_name AS "middleName",
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** sort customers. */

  static async sort(sort) {
    const adjustedSort = sort.split("N").join("_n");
    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          middle_name AS "middleName",
          last_name AS "lastName",
          phone,
          notes
        FROM customers
        ORDER BY $1`
      [adjustedSort]
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",
         middle_name AS "middleName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search for customers by name. */

  static async search(name) {
    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          middle_name AS "middleName",
          last_name AS "lastName",
          phone,
          notes
        FROM customers
        WHERE first_name ILIKE $1
        OR last_name ILIKE $1
        ORDER BY last_name, first_name`,
      [`%${name}%`]
    );

    return results.rows.map((c) => new Customer(c));
  }

  /** get top 10 customers by number of reservations. */

  static async getTopTen() {
    const results = await db.query(
      `SELECT c.id,
          c.first_name AS "firstName",
          c.middle_name AS "middleName",
          c.last_name AS "lastName",
          c.phone,
          c.notes,
          COUNT(r.id) AS "numReservations"
        FROM customers AS c
        JOIN reservations AS r ON c.id = r.customer_id
        GROUP BY c.id
        ORDER BY "numReservations" DESC
        LIMIT 10`
    );

    return results.rows.map((c) => new Customer(c));
  }

  /** combine first and last name to make full name. */

  get fullName() {
    if (this.middleName === null) {
      return `${this.firstName} ${this.lastName}`;
    } else {
      return `${this.firstName} ${this.middleName} ${this.lastName}`;
    }
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, middle_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
        [this.firstName, this.middleName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, middle_name=$2, last_name=$3, phone=$4, notes=$5
             WHERE id=$6`,
        [
          this.firstName,
          this.middleName,
          this.lastName,
          this.phone,
          this.notes,
          this.id,
        ]
      );
    }
  }

  delete() {
    db.query(
      `DELETE FROM customers
        WHERE id = $1`,
      [this.id]
    );
  }
}

module.exports = Customer;
