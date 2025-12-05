import Parse from './parseClient'

const CONFIG_KEY = 'clinic_config'

export interface ClinicConfig {
  clinicName: string
  clinicAddress: string
  clinicPhone?: string
  logoUrl?: string
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
      query.include('logo')
      const result = await query.first()
      
      if (result) {
        const logo = result.get('logo')
        let logoUrl: string | undefined
        if (logo && logo instanceof Parse.File) {
          logoUrl = logo.url()
        }
        
        return {
          clinicName: result.get('clinicName') || 'Hearing Clinic Pro',
          clinicAddress: result.get('clinicAddress') || '',
          clinicPhone: result.get('clinicPhone') || '',
          logoUrl: logoUrl,
        }
      }
      
      // Return defaults if not found
      return {
        clinicName: 'Hearing Clinic Pro',
        clinicAddress: '',
        clinicPhone: '',
        logoUrl: undefined,
      }
    } catch (error) {
      console.error('Error getting config:', error)
      return {
        clinicName: 'Hearing Clinic Pro',
        clinicAddress: '',
        clinicPhone: '',
        logoUrl: undefined,
      }
    }
  },

  /**
   * Update clinic configuration (admin only)
   */
  async updateConfig(config: ClinicConfig & { logoFile?: File; removeLogo?: boolean }): Promise<void> {
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
    
    // Handle logo upload or removal
    if (config.removeLogo) {
      configObj.unset('logo')
    } else if (config.logoFile) {
      const parseFile = new Parse.File('logo.png', config.logoFile, 'image/png')
      await parseFile.save()
      configObj.set('logo', parseFile)
    }
    
    await configObj.save()
  },
}

