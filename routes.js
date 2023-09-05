/** Routes for Lunchly */

const express = require("express");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  if (req.query.sort) {
    const sort = req.query.sort;
    try {
      if (sort === "top") {
        const customers = await Customer.getTopTen();
        return res.render("customer_list.html", { customers });
      }
      const customers = await Customer.sort(sort);
      return res.render("customer_list.html", { customers });
    } catch (err) {
      return next(err);
    }
  }
  if (req.query.search) {
    try {
      const customers = await Customer.search(req.query.search);
      return res.render("customer_list.html", { customers });
    } catch (err) {
      return next(err);
    }
  }
  try {
    const customers = await Customer.all();
    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  try {
    return res.render("customer_new_form.html");
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  try {
    const customer = new Customer(
      ({ firstName, middleName, lastName, phone, notes } = req.body)
    );
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Validate deletion page */

router.get("/:id/delete/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);
    return res.render("customer_delete_form.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** handle delete customer */

router.post("/:id/delete/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);
    await customer.delete();
    return res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    const reservations = await customer.getReservations();

    return res.render("customer_detail.html", { customer, reservations });
  } catch (err) {
    return next(err);
  }
});

/** Show top 10 customers based on number of reservations */

router.get("/top/", async function (req, res, next) {
  try {
    const customers = await Customer.getTopTen();

    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    res.render("customer_edit_form.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  try {
    const { firstName, middleName, lastName, phone, notes } = req.body;
    const customer = await Customer.get(req.params.id);
    customer.firstName = firstName;
    customer.middleName = middleName;
    customer.lastName = lastName;
    customer.phone = phone;
    customer.notes = notes;
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  try {
    const customerId = req.params.id;
    const startAt = new Date(req.body.startAt);
    const { numGuests, notes } = req.body;

    const reservation = new Reservation({
      customerId,
      startAt,
      numGuests,
      notes,
    });
    await reservation.save();

    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

/** show edit reservation form */

router.get("/:id/edit-res/", async function (req, res, next) {
  try {
    const reservationId = req.params.id;
    const reservation = await Reservation.get(reservationId);
    return res.render("reservation_edit_form.html", { reservation });
  } catch (err) {
    return next(err);
  }
});

/** handle editing a reservation */

router.post("/:id/edit-res/", async function (req, res, next) {
  try {
    const reservationId = req.params.id;
    const { customerId, numGuests, startAt, notes } = req.body;
    const reservation = await Reservation.get(reservationId);
    reservation.numGuests = numGuests;
    reservation.startAt = startAt;
    reservation.notes = notes;
    await reservation.save();
    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle deleting a reservation. */

router.post("/:id/delete-reservation/", async function (req, res, next) {
  try {
    const customerId = req.params.id;
    const { reservationId } = req.body;
    console.log(reservationId);
    const reservation = await Reservation.get(reservationId);

    await reservation.delete();

    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
