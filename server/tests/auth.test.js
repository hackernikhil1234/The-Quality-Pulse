const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../server'); // We need server.js to export 'app'
const User = require('../models/User');

let mongoServer;

// Before all tests, start the in-memory MongoDB
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    await mongoose.connect(uri);
});

// After all tests, stop the in-memory MongoDB and disconnect
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Before each test, clear the users collection
beforeEach(async () => {
    await User.deleteMany({});
});

describe('Auth API Endpoints', () => {
    const testUser = {
        name: 'Test Engineer',
        email: 'engineer@test.com',
        password: 'password123',
        role: 'Engineer'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toEqual(testUser.email);
        });

        it('should fail to register user with existing email', async () => {
            await User.create(testUser);
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login an existing user and return a token', async () => {
            await request(app).post('/api/auth/register').send(testUser);
            
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with incorrect password', async () => {
            await request(app).post('/api/auth/register').send(testUser);
            
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });
            
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user profile', async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            const token = registerRes.body.token;
            
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.email).toEqual(testUser.email);
        });

        it('should fail without authorization token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should respond with success message for any email input', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'any@email.com' });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });
});
