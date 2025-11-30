/**
 * Seed script to generate test appointments for a patient
 * Usage: node src/seedAppointments.js <clientId>
 */

require('dotenv').config()
const Parse = require('parse/node')

// Initialize Parse
Parse.initialize(
  process.env.PARSE_APP_ID || 'hearing-clinic-app-id',
  process.env.PARSE_JAVASCRIPT_KEY || '',
  process.env.PARSE_MASTER_KEY || 'your-master-key-change-this'
)

Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse'

const APPOINTMENT_TYPES = ['REPAIR', 'PURCHASE', 'AUDIOGRAM', 'COUNSELING']
const STATUSES = ['COMPLETED', 'CANCELED', 'SCHEDULED']
const STAFF_NAMES = ['BS. Nguyễn Anh', 'BS. Trần Minh', 'KTV. Phạm Lan', 'KTV. Lê Quang']
const NOTES = [
  'Khách phản ánh bên phải nghe nhỏ hơn.',
  'Tư vấn nâng cấp lên máy kỹ thuật số.',
  'Đo lại thính lực định kỳ 6 tháng.',
  'Thay ống tai và vệ sinh máy.',
  'Kiểm tra lại độ kín của nút tai.',
  'Điều chỉnh volume và tần số.',
  'Thay pin và bảo dưỡng máy.',
  'Tư vấn về cách sử dụng máy mới.',
  'Kiểm tra định kỳ sau 3 tháng.',
  'Khách hài lòng với chất lượng âm thanh.',
]

// Helper functions
function randomByWeight(weights) {
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0)
  let random = Math.random() * total
  for (const [key, weight] of Object.entries(weights)) {
    random -= weight
    if (random <= 0) {
      return key
    }
  }
  return Object.keys(weights)[0]
}

function randomDateInLastYears(years) {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - years, 0, 1)
  const endDate = now
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(randomTime)
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)]
}

async function seedAppointmentsForClient(clientId, count = 50) {
  try {
    console.log(`Starting to seed ${count} appointments for client: ${clientId}`)

    // Verify client exists
    const Client = Parse.Object.extend('Client')
    const clientQuery = new Parse.Query(Client)
    const client = await clientQuery.get(clientId)
    console.log(`Found client: ${client.get('fullName')}`)

    const Appointment = Parse.Object.extend('Appointment')
    const createdAppointments = []

    for (let i = 0; i < count; i++) {
      const appointment = new Appointment()

      // Random type with weights
      const type = randomByWeight({
        REPAIR: 0.25,
        PURCHASE: 0.25,
        AUDIOGRAM: 0.30,
        COUNSELING: 0.20,
      })

      // Random status with weights
      const status = randomByWeight({
        COMPLETED: 0.7,
        CANCELED: 0.1,
        SCHEDULED: 0.2,
      })

      // Random date in last 3 years
      const date = randomDateInLastYears(3)

      // Random staff and note
      const staffName = pickRandom(STAFF_NAMES)
      const note = pickRandom(NOTES)

      // Set fields
      appointment.set('client', client)
      appointment.set('type', type)
      appointment.set('status', status)
      appointment.set('date', date)
      appointment.set('staffName', staffName)
      appointment.set('note', note)

      // Optionally link to hearing report if type is AUDIOGRAM and status is COMPLETED
      if (type === 'AUDIOGRAM' && status === 'COMPLETED' && Math.random() > 0.3) {
        // Try to find an existing hearing report for this client
        const HearingReport = Parse.Object.extend('HearingReport')
        const reportQuery = new Parse.Query(HearingReport)
        reportQuery.equalTo('client', client)
        reportQuery.limit(1)
        const reports = await reportQuery.find()
        if (reports.length > 0) {
          appointment.set('hearingReport', reports[0])
        }
      }

      try {
        await appointment.save(null, { useMasterKey: true })
        createdAppointments.push(appointment)
        if ((i + 1) % 10 === 0) {
          console.log(`Created ${i + 1}/${count} appointments...`)
        }
      } catch (error) {
        console.error(`Error creating appointment ${i + 1}:`, error.message)
      }
    }

    console.log(`\nSuccessfully created ${createdAppointments.length} appointments!`)
    console.log('Appointment breakdown:')
    const typeCounts = {}
    const statusCounts = {}
    createdAppointments.forEach((apt) => {
      const type = apt.get('type')
      const status = apt.get('status')
      typeCounts[type] = (typeCounts[type] || 0) + 1
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    console.log('Types:', typeCounts)
    console.log('Statuses:', statusCounts)

    return createdAppointments
  } catch (error) {
    console.error('Error seeding appointments:', error)
    throw error
  }
}

// Main execution
async function main() {
  const clientId = process.argv[2]
  const count = parseInt(process.argv[3]) || 50

  if (!clientId) {
    console.error('Usage: node src/seedAppointments.js <clientId> [count]')
    console.error('Example: node src/seedAppointments.js abc123xyz 60')
    process.exit(1)
  }

  try {
    await seedAppointmentsForClient(clientId, count)
    console.log('\nDone!')
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed appointments:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { seedAppointmentsForClient }

