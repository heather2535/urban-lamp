def place_order(symbol, side, quantity, price=None):
    order = exchange.create_order(symbol=symbol, 
                                  type='market', 
                                  side=side, 
                                  amount=quantity)
    return order

# Example usage: Place a buy order
symbol = 'BTC/USDT'
side = 'buy'
quantity = 0.01
order = place_order(symbol, side, quantity)
print(order)
