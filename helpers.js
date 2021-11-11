
function generateRandomString(length) {
  return Math.random().toString(36).substr(2, length);
}

const getUserByEmail = (email, database) => {
  for (const id in database) {
    const user = database[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}


module.exports = {generateRandomString, getUserByEmail};