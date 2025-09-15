import type { GetStaticProps } from 'next'
import { useMemo } from 'react'
import { SWRConfig, unstable_serialize } from 'swr'

import { Flex, Link,Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react'

import { CollabImage, getSponsorImageUrl, NWNakedTitleContent } from '#/src/components/App/NWTitle'
import { type BuyData, type BuyTotalData, fetchTrackersData, type PaymentData,type PaymentTotalData } from '#/src/components/Data/Trackers/_'
import SalesAnalyticsBuys from '#/src/components/Data/Trackers/Buys'
import SalesAnalyticsPayments from '#/src/components/Data/Trackers/Payments'
import type { BacklinkReference, BacklinkTracker } from '#/src/lib/Backlinking';
import blStorage from '#/src/lib/Backlinking'
import { NWHead } from '#/src/pages/_app'
import { domainUrl, mainProduct } from '#/src/pages/_document'

//
//
//


/** gives empty data if `promise` has failed */
export const safeResultsArr = <T,>(promise: PromiseSettledResult<T[]>) : T[] => promise.status === 'fulfilled' ? promise.value : []
export const safeResultsObj = <T,>(promise: PromiseSettledResult<T>) : T => promise.status === 'fulfilled' ? promise.value : { } as T


//
const refreshedEveryMin = 10

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps : GetStaticProps = async (context) => {
  // make sure name is the last route arg
  const { name } = context.params
  if (typeof name !== 'string') {
    return { notFound: true }
  }

  // try to get info about sponsor
  const backlinkRef = blStorage[name as BacklinkTracker]
  if (backlinkRef.trackerId == null) {
    return { notFound: true }
  }

  /** https://swr.vercel.app/docs/with-nextjs */

  //
  const [
    payments,
    paymentsTotal,
    buys,
    buysTotal
  ] = await Promise.allSettled([
    fetchTrackersData<PaymentData[]>('/payments', backlinkRef.trackerId),
    fetchTrackersData<PaymentTotalData[]>('/paymentsTotal', backlinkRef.trackerId),
    fetchTrackersData<BuyData[]>('/buys', backlinkRef.trackerId),
    fetchTrackersData<BuyTotalData[]>('/buysTotal', backlinkRef.trackerId)
  ])

  //
  return {
    props: {
      fallback: {
        [unstable_serialize(['/payments', backlinkRef.trackerId])]: safeResultsArr(payments),
        [unstable_serialize(['/paymentsTotal', backlinkRef.trackerId])]: safeResultsArr(paymentsTotal),
        [unstable_serialize(['/buys', backlinkRef.trackerId])]: safeResultsArr(buys),
        [unstable_serialize(['/buysTotal', backlinkRef.trackerId])]: safeResultsArr(buysTotal)
      },
      /** */
      backlinkRef
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every {x} seconds
    revalidate: refreshedEveryMin * 60 // In seconds
  }
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export const getStaticPaths = async () => {
  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return {
    paths: Object.entries(blStorage).map(([name]) => ({
      params: {
        name
      }
    })),
    fallback: 'blocking'
  }
}

//
//
//

//
export const SalesAnalyticsPage = (props: {
  fallback: object,
  backlinkRef: BacklinkReference
}) => {
  //
  const link = useMemo(() =>
    props.backlinkRef.sponsorIsComprehensive != null
      ? `${domainUrl}presentedBy/${String(props.backlinkRef.uniqueDashboardName)}`
      : null
  , [props.backlinkRef.uniqueDashboardName, props.backlinkRef.sponsorIsComprehensive])

  //
  return (
    <SWRConfig value={{ fallback: props.fallback }}>
      <NWHead
        title={'Sales - ' + props.backlinkRef.dashboardDescription + ' - ' + mainProduct}
        description={'Sales & payments dashboards for ' + props.backlinkRef.dashboardDescription}
        imageUrl={props.backlinkRef.sponsorIsComprehensive ? getSponsorImageUrl(props.backlinkRef, true) : undefined}
      />
      <Flex direction='column' alignItems='center' justifyContent='center' flex='1' my='5'>
        <Title backlinkRef={props.backlinkRef}/>
        {link && <Flex fontSize='.8rem' m='2' gap='2' alignItems='center' justifyContent='center'>
          <Text>With your ref-link:</Text>
          <Link isExternal href={link}>{link}</Link>
        </Flex>}
        <Text fontSize='.8rem' mb='2'>(Refreshed every {refreshedEveryMin} minutes)</Text>
        <Tabs isLazy backgroundColor='#6666' colorScheme='pink'>
          <TabList>
            <Tab>Buys</Tab>
            <Tab>Payments</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SalesAnalyticsBuys
                backlinkRef={props.backlinkRef}
              />
            </TabPanel>
            <TabPanel>
              <SalesAnalyticsPayments
                backlinkRef={props.backlinkRef}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Flex direction='column' mt="2">
          <NWNakedTitleContent />
        </Flex>
      </Flex>
    </SWRConfig>
  )
}

//
const Title = (props: {
  backlinkRef: BacklinkReference
}) => {
  return (
    <Flex direction='column' alignItems='center' justifyContent='center' m='6' gap='1'>
      {props.backlinkRef.sponsorIsComprehensive && <CollabImage backlink={props.backlinkRef} />}
      <Text className='pixelFont' fontSize='.8rem'>{props.backlinkRef.dashboardDescription}{"'s"}</Text>
      <Text className='pixelFont' fontSize='.8rem'>Sales</Text>
    </Flex>
  )
}

export default SalesAnalyticsPage;