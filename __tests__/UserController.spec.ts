import { Request, Response } from 'express';
import { UserController } from '../src/controllers/UserController';
import { User } from '../src/models/User';
import Otp  from '../src/models/Otp';
import { Utils } from '../src/utils/Utils';
import * as otpUtils from '../src/utils/otpUtils';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/User');
jest.mock('../src/models/Otp');
jest.mock('../src/utils/Utils');
jest.mock('../src/utils/otpUtils');
jest.mock('jsonwebtoken');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  describe('register', () => {
    it('should send OTP for new user registration', async () => {
      const email = 'test@example.com';
      mockRequest.body = { email };
      
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (otpUtils.saveOtp as jest.Mock).mockResolvedValue('123456');
      (otpUtils.sendOtpEmail as jest.Mock).mockResolvedValue(true);

      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({ message: 'OTP sent successfully' });
    });

    it('should return error if email is missing', async () => {
      mockRequest.body = {};
      
      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Email is required.' });
    });

    it('should return error if user already exists with password', async () => {
      const email = 'test@example.com';
      mockRequest.body = { email };
      
      (User.findOne as jest.Mock).mockResolvedValue({ email, password: 'hashedPassword' });

      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists' });
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP and create user', async () => {
      const otp = '123456';
      const email = 'test@example.com';
      mockRequest.body = { otp };

      (Otp.findOne as jest.Mock).mockResolvedValue({
        otp,
        email,
        expiresAt: new Date(Date.now() + 3600000)
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      await UserController.verifyOTP(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'OTP verified successfully',
        email
      });
    });

    it('should return error if OTP is missing', async () => {
      mockRequest.body = {};

      await UserController.verifyOTP(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'OTP is required.' });
    });

    it('should return error if OTP is invalid or expired', async () => {
      mockRequest.body = { otp: '123456' };
      
      (Otp.findOne as jest.Mock).mockResolvedValue(null);

      await UserController.verifyOTP(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid or expired OTP.' });
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      mockRequest.body = { email, password };

      const mockUser = {
        _id: '123',
        email,
        password: 'hashedPassword'
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Utils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      await UserController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        token: 'mockToken',
        message: 'Login Successful',
        user: mockUser
      });
    });

    it('should return error if email or password is missing', async () => {
      mockRequest.body = {};

      await UserController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Email and password are required.' });
    });

    it('should return error if user is not found', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await UserController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return error if password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      mockRequest.body = { email, password };

      (User.findOne as jest.Mock).mockResolvedValue({ email, password: 'hashedPassword' });
      (Utils.comparePassword as jest.Mock).mockResolvedValue(false);

      await UserController.loginUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });

  describe('logoutUser', () => {
    it('should successfully logout user', async () => {
      mockRequest.header = jest.fn().mockReturnValue('Bearer token123');

      await UserController.logoutUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should return error if no token is provided', async () => {
      mockRequest.header = jest.fn().mockReturnValue(undefined);

      await UserController.logoutUser(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Bad Request - No token provided' });
    });
  });

  describe('setFirstTimePassword', () => {
    it('should set password for first time user', async () => {
      const email = 'test@example.com';
      const password = 'newPassword123';
      mockRequest.body = { email, password };

      (Utils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      (User.findOneAndUpdate as jest.Mock).mockResolvedValue({ email });

      await UserController.setFirstTimePassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Password set successfully' });
    });

    it('should return error if email or password is missing', async () => {
      mockRequest.body = {};

      await UserController.setFirstTimePassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Email and password are required.' });
    });

    it('should return error if user is not found', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'newPassword123' };
      
      (Utils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await UserController.setFirstTimePassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      mockRequest.body = { email, newPassword };

      const mockUser = {
        email,
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await UserController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Password reset successful' });
    });

    it('should return error if email or new password is missing', async () => {
      mockRequest.body = {};

      await UserController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Email and new password are required' });
    });

    it('should return error if user is not found', async () => {
      mockRequest.body = { email: 'test@example.com', newPassword: 'newPassword123' };
      
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await UserController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
});