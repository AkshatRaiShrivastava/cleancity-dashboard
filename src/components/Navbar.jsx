"use client"

import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"
import { auth } from "../firebase/config"

const Navbar = ({ setSidebarOpen }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(auth.currentUser)
  }, [])

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="ml-3 relative flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">{user?.email || "Admin"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar

