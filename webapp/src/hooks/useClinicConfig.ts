import { useQuery } from '@tanstack/react-query'
import { configService } from '../api/configService'
import { DEFAULT_LOGO } from '../constants/logo'

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

