import { useState} from 'react'
import './App.css'
import axios from 'axios'
import { useEffect } from 'react'

function App() {
  const[jokes,setJokes] = useState([])

  useEffect(()=>{

    // here when use /api so http://localhost:4000 url append in /api from vite.config.js file using proxy , and its say req. is send form the that origin so frontend origin and backend origin become the same
    axios.get('/api/jokes')
    .then((response)=>{
        setJokes(response.data)
    })
    .catch((error)=>{
        throw error;
    })
  })

  return (
    <>
      <h1>Hello World</h1>
      <h2>jokes:{jokes.length}</h2>
      {
        jokes.map((joke)=>( 
          <div key={joke.id}>
            <h2>{joke.content}</h2>
          </div>
        ))
      }
    </>
  )
}

export default App
