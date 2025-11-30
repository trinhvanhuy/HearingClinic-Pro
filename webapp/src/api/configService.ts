import Parse from './parseClient'

const CONFIG_KEY = 'clinic_config'

export interface ClinicConfig {
  clinicName: string
  clinicAddress: string
  clinicPhone?: string
}

export const configService = {
  /**
   * Get clinic configuration
   */
  async getConfig(): Promise<ClinicConfig> {
    try {
      const Config = Parse.Object.extend('Config')
      const query = new Parse.Query(Config)
      query.equalTo('key', CONFIG_KEY)
      const result = await query.first()
      
      if (result) {
        return {
          clinicName: result.get('clinicName') || 'Hearing Clinic Pro',
          clinicAddress: result.get('clinicAddress') || '',
          clinicPhone: result.get('clinicPhone') || '',
        }
      }
      
      // Return defaults if not found
      return {
        clinicName: 'Hearing Clinic Pro',
        clinicAddress: '',
        clinicPhone: '',
      }
    } catch (error) {
      console.error('Error getting config:', error)
      return {
        clinicName: 'Hearing Clinic Pro',
        clinicAddress: '',
        clinicPhone: '',
      }
    }
  },

  /**
   * Update clinic configuration (admin only)
   */
  async updateConfig(config: ClinicConfig): Promise<void> {
    const Config = Parse.Object.extend('Config')
    const query = new Parse.Query(Config)
    query.equalTo('key', CONFIG_KEY)
    
    let configObj = await query.first()
    
    if (!configObj) {
      configObj = new Config()
      configObj.set('key', CONFIG_KEY)
    }
    
    configObj.set('clinicName', config.clinicName)
    configObj.set('clinicAddress', config.clinicAddress)
    if (config.clinicPhone) {
      configObj.set('clinicPhone', config.clinicPhone)
    } else {
      configObj.unset('clinicPhone')
    }
    
    await configObj.save()
  },
}

