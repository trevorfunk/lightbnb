const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const { query } = require('express');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const values = [email];
  
  const queryEmail = `
    SELECT * FROM users
    WHERE users.email = $1;
    `;

  return pool
    .query(queryEmail, values)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return console.error(err);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const values = [id];

  const queryId = `
  SELECT * FROM users
  WHERE users.id = $1;
  `;
  return pool
    .query(queryId, values)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return console.error(err);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const values = [user.name, user.email, user.password];
 
  const queryUser = `
  INSERT INTO users (name, email, password)
  VALUES($1, $2, $3)
  RETURNING *;
  `;
  return pool
    .query(queryUser, values)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return console.error(err);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const values = [guest_id, limit];

  const queryReservations = `
    SELECT reservations.id, users.name, users.id, properties.thumbnail_photo_url, properties.title, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces, properties.cost_per_night, reservations.start_date, reservations.end_date, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    JOIN users ON reservations.guest_id = users.id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id, users.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;

  return pool
    .query(queryReservations, values)
    .then((results) => {
      return results.rows;
    })
    .catch((err) => {
      return console.error(err);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1 = 1
  `;

  if (options.city) {
    queryParams.push(`%${options.city}`);
    queryString += `AND city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND properties.owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `AND cost_per_night >= $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `AND cost_per_night <= $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `AND rating >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      return console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];
  const queryAddProperty = `
    INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
`;
  return pool
    .query(queryAddProperty, values)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      return console.error(err.message);
    });
};
exports.addProperty = addProperty;


