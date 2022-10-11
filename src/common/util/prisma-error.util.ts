import { Prisma } from '@prisma/client';

const PrismaClientKnownRequestError = (error) => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

/**
 * Check if error code means record NotFound
 * @param error error object
 * @returns {boolean}
 */
export const isNotFoundError = (error) => {
  return PrismaClientKnownRequestError(error) && error.code === 'P2025';
};

/**
 * Check if error code means record already exists
 * @param error error object
 * @note this is usually used for unique fields when creating a record
 * @returns {boolean}
 */
export const isAlreadyExistsError = (error) => {
  return PrismaClientKnownRequestError(error) && error.code === 'P2002';
};
