// Filename: addUser.js
import PocketBase from 'pocketbase';

// 1. Initialize PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090');

// 2. Define the user creation function
async function createUser() {
  console.log('Attempting to create a new user...');
  try {
    // User data to be sent
    const newUser = {
        email: `testuser_${Date.now()}@example.com`, // Unique email
        password: '1234567890',
        passwordConfirm: '1234567890',
        name: 'Test User'
    };

    // Create the user record
    const record = await pb.collection('users').create(newUser);

    console.log('✅ User created successfully!');
    console.log('New user details:', record);

  } catch (error) {
    // Handle potential errors (e.g., email already exists)
    console.error('❌ An error occurred:', error.message);
    // For more details on validation errors:
    // console.error('Detailed errors:', error.data.data);
  }
}

// 3. Run the function
createUser();