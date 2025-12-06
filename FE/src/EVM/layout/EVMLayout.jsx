import React from 'react'
import EVMSidebar from './Sidebar'
import EVMNavbar from './Navbar'
import { Outlet } from 'react-router'

const EVMLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <EVMSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EVMNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default EVMLayout


