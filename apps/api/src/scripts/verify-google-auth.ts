import { googleAuth } from '../controllers/auth.controller.js';
import { pgPool } from '../config/db.js';
import jwt from 'jsonwebtoken';

async function runVerification() {
  console.log('[Verify] Starting Google Auth Controller verification...');

  let statusCode: any = 0;
  let responseData: any = null;

  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    json: (data: any) => {
      responseData = data;
      return mockRes;
    }
  } as any;

  // Test 1: Empty credential should fail with 400
  console.log('\n--- Test 1: Empty credential validation ---');
  await googleAuth({ body: {} } as any, mockRes);
  console.log(`Status: ${statusCode}, Success: ${responseData?.success}`);
  if (statusCode !== 400) {
    throw new Error(`Expected 400, got ${statusCode}`);
  }

  // Test 2: Valid Google Auth (dev mock token)
  console.log('\n--- Test 2: Valid dev Google Auth payload ---');
  const testEmail = `test.google.${Date.now()}@aica.lab`;
  await googleAuth(
    {
      body: {
        credential: `dev-mock-google-${testEmail}`
      }
    } as any,
    mockRes
  );

  console.log(`Status: ${statusCode}, Success: ${responseData?.success}`);
  console.log(`User created:`, responseData?.data?.user);
  console.log(`Profile:`, responseData?.data?.profile);

  if (statusCode !== 200 || !responseData?.data?.accessToken) {
    throw new Error(`Expected 200 with accessToken, got ${statusCode}: ${JSON.stringify(responseData)}`);
  }

  const token = responseData.data.accessToken;
  const decoded: any = jwt.decode(token);
  console.log(`Decoded JWT:`, decoded);
  if (decoded.email !== testEmail) {
    throw new Error(`Expected email ${testEmail}, got ${decoded.email}`);
  }

  // Test 3: Authenticating again with same Google account (should retrieve existing user)
  console.log('\n--- Test 3: Existing user Google Auth login ---');
  await googleAuth(
    {
      body: {
        credential: `dev-mock-google-${testEmail}`
      }
    } as any,
    mockRes
  );

  console.log(`Status: ${statusCode}, Same User ID: ${responseData?.data?.user?.id === decoded.id}`);
  if (responseData?.data?.user?.id !== decoded.id) {
    throw new Error(`Expected existing user ID ${decoded.id}, got ${responseData?.data?.user?.id}`);
  }

  // Clean up test user
  await pgPool.query('DELETE FROM users WHERE email = $1', [testEmail]);
  console.log('[Verify] Test user cleaned up.');
  console.log('✅ ALL GOOGLE AUTH BACKEND CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('[Verify Failed]:', err);
  process.exit(1);
});
