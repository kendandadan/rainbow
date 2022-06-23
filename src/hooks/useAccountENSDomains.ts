import { useMemo } from 'react';
import { useQuery } from 'react-query';
import useAccountProfile from './useAccountProfile';
import { EnsAccountRegistratonsData } from '@rainbow-me/apollo/queries';
import {
  fetchAccountRegistrations,
  fetchImages,
} from '@rainbow-me/handlers/ens';
import {
  getENSDomains,
  setENSDomains,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';

const queryKey = ({ accountAddress }: { accountAddress: string }) => [
  'domains',
  accountAddress,
];

const imagesQueryKey = ({ name }: { name: string }) => ['domainImages', name];

const STALE_TIME = 10000;

async function fetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  if (!accountAddress) return [];
  const result = await fetchAccountRegistrations(accountAddress);
  const registrations = result.data?.account?.registrations || [];
  const domains = await Promise.all(
    registrations.map(async ({ domain }) => {
      const images = await fetchAccountENSImages(domain.name);
      return {
        ...domain,
        images,
      };
    })
  );

  return domains;
}

async function fetchENSDomainsWithCache({
  accountAddress,
}: {
  accountAddress: string;
}) {
  const cachedDomains = await getENSDomains(accountAddress);
  if (cachedDomains)
    queryClient.setQueryData(queryKey({ accountAddress }), cachedDomains);
  const ensDomains = await fetchAccountENSDomains({ accountAddress });
  setENSDomains(accountAddress, ensDomains);
  return ensDomains;
}

export async function prefetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  queryClient.prefetchQuery(
    queryKey({ accountAddress }),
    async () => await fetchENSDomainsWithCache({ accountAddress }),
    { staleTime: STALE_TIME }
  );
}

async function fetchAccountENSImages(name: string) {
  return queryClient.fetchQuery(
    imagesQueryKey({ name }),
    async () => await fetchImages(name),
    {
      staleTime: 120000,
    }
  );
}

export default function useAccountENSDomains() {
  const { accountAddress, accountENS } = useAccountProfile();

  const { data: domains, isLoading, isSuccess } = useQuery<
    EnsAccountRegistratonsData['account']['registrations'][number]['domain'][]
  >(queryKey({ accountAddress }), async () =>
    fetchENSDomainsWithCache({ accountAddress })
  );

  const { ownedDomains, primaryDomain, nonPrimaryDomains } = useMemo(() => {
    const ownedDomains = domains?.filter(
      ({ owner }) => owner?.id?.toLowerCase() === accountAddress?.toLowerCase()
    );
    return {
      nonPrimaryDomains:
        ownedDomains?.filter(({ name }) => accountENS !== name) || [],
      ownedDomains,
      primaryDomain: ownedDomains?.find(({ name }) => accountENS === name),
    };
  }, [accountAddress, accountENS, domains]);

  const uniqueDomain = useMemo(() => {
    return primaryDomain
      ? primaryDomain
      : nonPrimaryDomains?.length === 1
      ? nonPrimaryDomains?.[0]
      : null;
  }, [nonPrimaryDomains, primaryDomain]);

  return {
    domains,
    isLoading,
    isSuccess,
    nonPrimaryDomains,
    ownedDomains,
    primaryDomain,
    uniqueDomain,
  };
}
