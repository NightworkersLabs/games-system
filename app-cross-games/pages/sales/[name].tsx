import { Text, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Link } from '@chakra-ui/react'
import { GetServerSideProps } from 'next'
import blStorage, { BacklinkReference, BacklinkTracker } from 'lib/Backlinking'
import { fetchTrackersData } from 'components/Data/Trackers/_'
import SalesAnalyticsBuys from 'components/Data/Trackers/Buys'
import SalesAnalyticsPayments from 'components/Data/Trackers/Payments'
import { NWHead } from 'pages/_app'
import { CollabImage, getSponsorImageUrl, NWNakedTitleContent } from 'components/App/NWTitle'
import { domainUrl, mainProduct } from 'pages/_document'
// eslint-disable-next-line camelcase
import { SWRConfig, unstable_serialize } from 'swr'
import { useMemo } from 'react'

//
//
//

//
const refreshedEveryMin = 10

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps : GetServerSideProps = async (context) => {
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
  ] = await Promise.all([
    fetchTrackersData('/payments', backlinkRef.trackerId),
    fetchTrackersData('/paymentsTotal', backlinkRef.trackerId),
    fetchTrackersData('/buys', backlinkRef.trackerId),
    fetchTrackersData('/buysTotal', backlinkRef.trackerId)
  ] as const)

  //
  return {
    props: {
      fallback: {
        [unstable_serialize(['/payments', backlinkRef.trackerId])]: payments,
        [unstable_serialize(['/paymentsTotal', backlinkRef.trackerId])]: paymentsTotal,
        [unstable_serialize(['/buys', backlinkRef.trackerId])]: buys,
        [unstable_serialize(['/buysTotal', backlinkRef.trackerId])]: buysTotal
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
export async function getStaticPaths () {
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
export default function SalesAnalyticsPage (props: {
  fallback: any
  backlinkRef: BacklinkReference
}) {
  //
  const link = useMemo(() =>
    props.backlinkRef.sponsorIsComprehensive != null
      ? `${domainUrl}presentedBy/${props.backlinkRef.uniqueDashboardName}`
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
function Title (props: {
  backlinkRef: BacklinkReference
}) {
  return (
    <Flex direction='column' alignItems='center' justifyContent='center' m='6' gap='1'>
      {props.backlinkRef.sponsorIsComprehensive && <CollabImage backlink={props.backlinkRef} />}
      <Text className='pixelFont' fontSize='.8rem'>{props.backlinkRef.dashboardDescription}{"'s"}</Text>
      <Text className='pixelFont' fontSize='.8rem'>Sales</Text>
    </Flex>
  )
}
