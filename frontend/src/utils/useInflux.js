import { useEffect, useRef, useState } from 'react'
import {
  fetchBuckets as _fetchBuckets,
  fetchMeasurements as _fetchMeasurements,
  fetchFields as _fetchFields,
  doQuery,
  queryGraph as _queryGraph,
  fetchGraphs as _fetchGraphs,
  createGraph as _createGraph,
  deleteGraph as _deleteGraph,
} from '@api/influxdbAPI'

function useBuckets(setError) {
  const [buckets, __setBuckets] = useState([])

  const fetchBuckets = () => {
    _fetchBuckets(__setBuckets, setError)
  }

  // // fetch data
  // useEffect(() => {
  //     fetchBuckets()
  // }, [])

  return { buckets, fetchBuckets }
}

function useMeasurements(setError) {
  const [measurements, setMeasurements] = useState([])

  const fetchMeasurements = (bucket) => {
    _fetchMeasurements(bucket, setMeasurements, setError)
  }

  return { measurements, fetchMeasurements }
}

function useFields(setError) {
  const [fields, setFields] = useState([])

  const fetchFields = (bucket, measurement) => {
    _fetchFields(bucket, measurement, setFields, setError)
  }

  return { fields, fetchFields }
}

export { useBuckets, useMeasurements, useFields }
