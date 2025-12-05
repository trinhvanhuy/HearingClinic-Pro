import { useQuery } from '@tanstack/react-query'
import { configService } from '../api/configService'

const DEFAULT_LOGO = '/assets/logo-transparent.png'

export function useClinicConfig() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['clinic-config'],
    queryFn: () => configService.getConfig(),
  })

  const logoUrl = config?.logoUrl || DEFAULT_LOGO

  return {
    config,
    logoUrl,
    isLoading,
  }
}

