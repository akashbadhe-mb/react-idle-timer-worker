import { render, screen, act, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdleTimeOutHandler from './IdleTimeOutHandler'

let mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: jest.fn(),
}

jest.mock('./createWorker', () => {
  return {
    createWorker: () => {
      return mockWorker
    },
  }
})

beforeEach(() => {
  console.error = jest.fn
  jest.useFakeTimers()
})

describe('IdleTimeOutHandler', () => {
  it('should render without errors', () => {
    render(<IdleTimeOutHandler timeOutInterval={10} countDownInterval={10} />)
  })

  it('should show dialog when user is idle', async () => {
    render(<IdleTimeOutHandler timeOutInterval={10} countDownInterval={10} />)
    mockWorker.onmessage({ data: 'onIdle' })
    expect(await screen.findByText(/Session Timeout/i)).toBeInTheDocument()
  })

  it('should call onIdle when user is idle', () => {
    const onIdle = jest.fn()
    render(
      <IdleTimeOutHandler
        onIdle={onIdle}
        timeOutInterval={10}
        countDownInterval={10}
      />,
    )
    mockWorker.onmessage({ data: 'countDownCompleted' })
    expect(onIdle).toHaveBeenCalled()
  })

  it('should show remaining time when user is idle', async () => {
    render(<IdleTimeOutHandler timeOutInterval={10} countDownInterval={10} />)
    mockWorker.onmessage({ data: 'onIdle' })
    mockWorker.onmessage({ data: 'countDown:1:00' })
    expect(
      await screen.findByText(
        /Due to user inactivity you will be logged out in 1:00/i,
      ),
    ).toBeInTheDocument()
  })

  it('should call onActive when user interacts with the page', () => {
    const onActive = jest.fn()
    render(
      <IdleTimeOutHandler
        onActive={onActive}
        timeOutInterval={10}
        countDownInterval={10}
      />,
    )
    mockWorker.onmessage({ data: 'onActive' })
    expect(onActive).toHaveBeenCalled()
  })

  it('should reset timer when user interacts with the page', () => {
    render(<IdleTimeOutHandler timeOutInterval={10} countDownInterval={10} />)
    const lastInteractionTime = new Date().valueOf() - 2 * 60 * 1000
    localStorage.setItem(
      'lastInteractionTime',
      JSON.stringify(lastInteractionTime),
    )

    userEvent.click(document.body)

    const updatedLastInteractionTime = JSON.parse(
      localStorage.getItem('lastInteractionTime')!,
    )
    expect(updatedLastInteractionTime).toBeGreaterThan(lastInteractionTime)
  })

  it('should keep user signed in when user clicks "Keep me signed In" button', async () => {
    render(<IdleTimeOutHandler timeOutInterval={10} countDownInterval={10} />)
    mockWorker.onmessage({ data: 'onIdle' })
    mockWorker.onmessage({ data: 'countDown:1:00' })
    userEvent.click(await screen.findByText(/Keep me signed In/i))
    mockWorker.onmessage({ data: 'onActive' })
    await waitForElementToBeRemoved(() => screen.queryByText(/Session Timeout/i))
    expect(screen.queryByText(/Session Timeout/i)).not.toBeInTheDocument()
  })
})
