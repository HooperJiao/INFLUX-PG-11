import { useState, useEffect } from "react";
import { fetchGraphs, deleteGraph as _deleteGraph } from "@api/influxdbAPI";

function History() {

    const [ graphs, setGraphs] = useState([])
    const [ error, setError] = useState('')

    const deleteGraph = (id) => {
        _deleteGraph(id, setGraphs, setError)
    }

    useEffect(() => {
        fetchGraphs(setGraphs, setError)
    }, []);

    return ( <>
        <div className="text-left">
            <div className="space-y-4">
            {graphs.map((graph, index) => (
                <div className="w-full flex flex-col space-y-2 border p-4 rounded-lg"
                    key={`graph-${index}`}>
                    <div className="flex w-full items-center justify-between">
                        
                        Create Time: {graph.created_at}
                        <button className="bg-red-500 text-white text-sm rounded-3xl" onClick={() => deleteGraph(graph.id)}>x</button>
                    </div>
                    <iframe 
                        className="w-full h-full min-h-96" 
                        src={graph.url}>
                    </iframe>
                </div>
            ))}
            </div>
        </div>
    </> );
}

export default History;