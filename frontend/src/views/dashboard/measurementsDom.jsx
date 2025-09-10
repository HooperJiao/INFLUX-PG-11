import { useMeasurements as _useMeasurements } from '@utils/useInflux'
import { useState, useEffect } from 'react'
import { Select } from '../../components/select'
function useMeasurements({bucket, measurement, setMeasurement}) {
  const [error, setError] = useState('')
  const { measurements, fetchMeasurements } = _useMeasurements(setError)

    useEffect(() => {
      if (bucket === undefined || bucket == '') {
        return
      }
      console.log("update measurements dom...")
      fetchMeasurements(bucket)
    }, [bucket])

    const MeasurementsDom = <div className='w-full'>
        <Select
            title={"Measurement"}
            options={measurements}
            value={measurement}
            changeValue={setMeasurement}
        />
    </div>
    return {MeasurementsDom, measurements};
}

export default useMeasurements;
