import { hashPassword } from 'src/utils/crypto'
import { ACCOUNT_STATUS, CLASSROOM_ROLE } from 'src/utils/constants'

export default {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await hashPassword('admin')
    return queryInterface.bulkInsert(
      'Users',
      [
        {
          username: 'admin',
          password: hashedPassword,
          firstName: 'admin',
          email: 'admin@gmail.com',
          status: ACCOUNT_STATUS.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: CLASSROOM_ROLE.ADMIN,
        },
      ],
      {}
    )
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', { username: 'admin' })
  },
}
