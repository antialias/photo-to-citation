import React from "react"
import { render, screen } from '@testing-library/react'
import ClientComponent from '../ClientComponent'
import { describe, it, expect } from 'vitest'

describe('ClientComponent', () => {
  it('renders text', () => {
    render(<ClientComponent />)
    expect(screen.getByText('Client Component')).toBeInTheDocument()
  })
})
