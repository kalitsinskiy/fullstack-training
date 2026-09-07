const api = () => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve('data');
      },
      Math.random() * (20000 - 1000) + 1000
    );
  });
};

const REQUEST_TIMEOUT = 5000;

/* some logic */
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error('REQUEST TIMEOUT - 5s'));
  }, REQUEST_TIMEOUT);
});

/* another logic */
async function fetchData() {
  try {
    const resposne = await Promise.race([api(), timeoutPromise]);
    console.log('Response:', resposne);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchData();
